/**
 * kvPrefs — typed Puter-KV preference layer.
 *
 * Use this for cross-device cross-session user-specific preferences
 * that should follow the user, not the browser. Local state (toggle
 * positions, ephemeral UI) stays in localStorage or React state. User-
 * owned data goes through this module.
 *
 * Keys we own today
 *   - `auramind.last_topic`   — most recent deck-creation topic (string)
 *   - `auramind.theme`        — `'dark' | 'light' | 'system'` (string)
 *   - `auramind.ai_persona`   — one of the persona presets (string)
 *   - `auramind.ai_chain`     — `'groq' | 'puter' | 'auto'` (string)
 *
 * Why a separate file
 *   - Consumers want a typed API; the underlying `setKv` exposes `any`.
 *   - Centralises the keys so devs don't collide on the Puter KV namespace.
 *   - Easy to wipe (`clearAuramindPrefs()`) without nuking other apps.
 *
 * Graceful degradation
 *   - If Puter SDK is unreachable, `kvPrefs.get*` falls back to
 *     localStorage so the UI still works on users who aren't signed in.
 *   - Writes to Puter go through `setKv` (debounced 1500ms); fallback
 *     writes are immediate via localStorage so user doesn't lose state.
 */

import { setKv, getKv } from '../api/puter';

const LS_PREFIX = 'auramind.';

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(LS_PREFIX + key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null): void {
  try {
    if (value == null) localStorage.removeItem(LS_PREFIX + key);
    else localStorage.setItem(LS_PREFIX + key, value);
  } catch {
    // noop — localStorage quota / private browsing
  }
}

export type ThemePref = 'dark' | 'light' | 'system';
export type AiChainPref = 'auto' | 'groq' | 'puter';
export type AiPersonaPref = 'tutor' | 'concise' | 'analogy-heavy' | 'socratic';

export const kvPrefs = {
  /** Most recent topic entered into "AI Magic" — rehydrated on next visit. */
  async getLastTopic(): Promise<string | null> {
    try {
      const v = await getKv<string>('auramind.last_topic');
      if (v) return v;
    } catch {
      // fall through
    }
    return readLocal('last_topic');
  },
  async setLastTopic(value: string | null): Promise<void> {
    writeLocal('last_topic', value);
    try {
      await setKv('auramind.last_topic', value);
    } catch {
      /* local already persisted */
    }
  },

  async getTheme(): Promise<ThemePref | null> {
    try {
      const v = await getKv<ThemePref>('auramind.theme');
      if (v) return v;
    } catch {
      /* ignore */
    }
    return (readLocal('theme') as ThemePref | null) ?? null;
  },
  async setTheme(value: ThemePref | null): Promise<void> {
    writeLocal('theme', value);
    try {
      await setKv('auramind.theme', value);
    } catch {
      /* local already persisted */
    }
  },

  async getAiChain(): Promise<AiChainPref | null> {
    try {
      const v = await getKv<AiChainPref>('auramind.ai_chain');
      if (v) return v;
    } catch {
      /* ignore */
    }
    return (readLocal('ai_chain') as AiChainPref | null) ?? null;
  },
  async setAiChain(value: AiChainPref | null): Promise<void> {
    writeLocal('ai_chain', value);
    try {
      await setKv('auramind.ai_chain', value);
    } catch {
      /* local already persisted */
    }
  },
};

/** Wipe all AuraMind-owned KV keys — useful from a "Reset preferences" button. */
export async function clearAuramindPrefs(): Promise<void> {
  ['last_topic', 'theme', 'ai_chain'].forEach((k) => writeLocal(k, null));
  try {
    const { listKv, delKv } = await import('../api/puter');
    const all = await listKv();
    for (const e of all) {
      if (e.key.startsWith('auramind.')) await delKv(e.key);
    }
  } catch {
    /* offline / not signed in — localStorage wiped, that's fine */
  }
}
