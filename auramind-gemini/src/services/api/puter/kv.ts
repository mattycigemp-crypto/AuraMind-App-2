/**
 * puter.kv wrapper — keyed user preferences, cross-session persistence.
 *
 * Why this matters
 * ────────────────
 * AuraMind already has user-authenticated state via Supabase, but cross-
 * device cross-session user prefs (theme, AI-chain order, recent topics,
 * last-used model) currently live in localStorage which is per-browser.
 * Puter KV gives us per-USER cross-device prefs with no extra infra.
 *
 * What we expose
 *   - `setKv(key, value)` — debounced 1500ms so a rapid sequence of
 *     slider/toggle changes does not hammer Puter's free-tier quota.
 *     Returns a Promise that resolves with the actual Puter round-trip
 *     outcome.
 *   - `flushKv()` — commits every pending debounced write immediately.
 *   - `getKv(key)` — Promise<unknown>; returns `null` on miss.
 *   - `delKv(key)` — remove a single key.
 *   - `listKv()` — Promise<Array<{key, value}>> for the user's namespace.
 *
 * KV keys
 * ───────
 * We don't share a namespace; consumers should prefix their keys by their
 * own domain (`auramind.theme`, `auramind.aiChain`, `auramind.lastTopic`,
 * etc.) so a future "wipe my KV button" can be scoped.
 *
 * Implementation notes
 * ────────────────────
 * The debounce pending map's value shape includes the resolve/reject
 * callbacks and the staged value, so `flushKv()` can re-issue the most-
 * recent write immediately rather than abandoning the in-flight Promise.
 */

import { loadPuterModule } from '../puterProvider';
import { PuterKvError } from './types';

function readEnv(key: string, fallback = '') {
  return ((import.meta as any).env ?? {})[key] ?? fallback;
}

function isPuterEnabled() {
  return readEnv('VITE_USE_PUTER', 'true') === 'true';
}

interface PendingKvWrite {
  key: string;
  handle: ReturnType<typeof setTimeout>;
  value: any;
  resolve: (ok: boolean) => void;
  reject: (err: any) => void;
}

/**
 * Pending debounced writes. Each entry stores the timer handle, the value
 * staged for commit, AND the resolve/reject callbacks so `flushKv()` can
 * surface the real upstream outcome instead of abandoning the Promise.
 */
const pendingWrites = new Map<string, PendingKvWrite>();
const DEBOUNCE_MS = 1500;

async function sdk(): Promise<any> {
  return loadPuterModule();
}

/**
 * Internal — actually performs the Puter request once debounced.
 * Called by setKv() after the wait OR by flushKv() to drain immediately.
 */
async function rawSet(key: string, value: any): Promise<boolean> {
  if (!isPuterEnabled()) {
    throw new PuterKvError('Puter disabled (VITE_USE_PUTER != "true")', {
      puterMessage: 'disabled',
    });
  }
  const puter = await sdk();
  try {
    if (typeof puter?.kv?.set === 'function') {
      return Boolean(await puter.kv.set(key, value));
    }
    // Hard fail on prior versions that lack kv.set vs auth requirement.
    if (!puter?.auth?.isSignedIn?.()) {
      throw new PuterKvError('Puter KV set requires an active sign-in session.', {
        puterMessage: 'not-signed-in',
      });
    }
    return Boolean(puter.kv.set(key, value));
  } catch (e: any) {
    const msg = e?.message || String(e);
    const lower = msg.toLowerCase();
    const quotaHit = /quota|rate.?limit|cap/.test(lower);
    // If rawSet already produced a PuterKvError, propagate it unchanged so
    // the original `puterMessage` survives.
    if (e instanceof PuterKvError) throw e;
    throw new PuterKvError(`KV set failed: ${msg}`, {
      isQuotaExceeded: quotaHit,
      puterMessage: msg,
    });
  }
}

/**
 * setKv — debounced write.
 *
 * If the same key has been called within 1500ms of a previous call, the
 * previous pending write is dropped and the new value becomes the one
 * sent after the wait. The Promise returned ALWAYS resolves with the
 * actual Puter round-trip outcome (or rejects) — callers can `await` it
 * to know the outcome before showing UI feedback.
 */
export async function setKv(
  key: string,
  value: any,
  opts: { flush?: boolean } = {},
): Promise<boolean> {
  const prev = pendingWrites.get(key);
  if (prev) {
    clearTimeout(prev.handle);
    pendingWrites.delete(key);
    // Resolve the prior Promise with `false` instead of rejecting. Rapid
    // callers (e.g. theme-toggle spam) downstream `await setKv('theme', x)`
    // without `.catch`, and an unhandled rejection from a superseded write
    // surfaces as a red console during normal UX. Semantically, a superseded
    // write is *not an error* — its successor carries the same intent and
    // will itself resolve (or reject) with the real upstream outcome.
    prev.resolve(false);
  }
  if (opts.flush) {
    return rawSet(key, value);
  }
  return new Promise<boolean>((resolve, reject) => {
    const handle = setTimeout(async () => {
      pendingWrites.delete(key);
      try {
        resolve(await rawSet(key, value));
      } catch (e) {
        reject(e);
      }
    }, DEBOUNCE_MS);
    pendingWrites.set(key, { key, handle, value, resolve, reject });
  });
}

/**
 * Force every pending debounced write to commit immediately.
 *
 * Iterates pendingWrites, clears each timer, and re-issues the staged
 * write through `rawSet()` so the original Promise resolves with the
 * actual upstream outcome. Safe to call at any time — calling with an
 * empty pending set is a no-op.
 */
export async function flushKv(): Promise<void> {
  const staged = Array.from(pendingWrites.values());
  for (const entry of staged) {
    clearTimeout(entry.handle);
    pendingWrites.delete(entry.key);
    try {
      entry.resolve(await rawSet(entry.key, entry.value));
    } catch (e) {
      entry.reject(e);
    }
  }
}

/** Read a KV value; null if the key was never set. */
export async function getKv<T = unknown>(key: string): Promise<T | null> {
  if (!isPuterEnabled()) return null;
  const puter = await sdk();
  try {
    const value = await puter?.kv?.get?.(key);
    return value === undefined ? null : (value as T);
  } catch (e: any) {
    const msg = e?.message || '';
    if (e instanceof PuterKvError) throw e;
    /* "key not found" should be a clean null, not an error. */
    if (/not[\s_-]?found|missing|404/i.test(msg)) return null;
    throw new PuterKvError(`KV get failed: ${msg}`, {
      puterMessage: msg,
    });
  }
}

/** Delete a single key. */
export async function delKv(key: string): Promise<boolean> {
  if (!isPuterEnabled()) return false;
  const puter = await sdk();
  try {
    if (typeof puter?.kv?.delete === 'function') return Boolean(await puter.kv.delete(key));
    if (typeof puter?.kv?.del === 'function') return Boolean(await puter.kv.del(key));
    return false;
  } catch (e: any) {
    if (e instanceof PuterKvError) throw e;
    throw new PuterKvError(`KV del failed: ${e?.message ?? String(e)}`, {
      puterMessage: e?.message,
    });
  }
}

/** Enumerate every KV entry — used by the Settings backup-restore page. */
export async function listKv(): Promise<Array<{ key: string; value: any }>> {
  if (!isPuterEnabled()) return [];
  const puter = await sdk();
  try {
    if (typeof puter?.kv?.list === 'function') return (await puter.kv.list()) ?? [];
    if (typeof puter?.kv?.keys === 'function') {
      const keys: string[] = (await puter.kv.keys()) ?? [];
      const out: Array<{ key: string; value: any }> = [];
      for (const k of keys) out.push({ key: k, value: await puter.kv.get(k) });
      return out;
    }
    return [];
  } catch (e: any) {
    if (e instanceof PuterKvError) throw e;
    throw new PuterKvError(`KV list failed: ${e?.message ?? String(e)}`, {
      puterMessage: e?.message,
    });
  }
}
