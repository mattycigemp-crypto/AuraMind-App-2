/**
 * puter.fs wrapper — cloud filesystem ops for backup, hosting, and sync.
 *
 * Why this matters
 * ───────────────
 * AuraMind stores decks in Supabase. But putting user-generated content
 * on a free-tier cloud fs means:
 *   - backup / export to a portable format (JSON),
 *   - cross-device sync via "drag-and-drop my folder back into AuraMind",
 *   - cheap-and-cheerful user-owned storage that doesn't bloat our DB.
 *
 * Path convention
 * ──────────────
 * We namespace every write under `/AuraMind/<bucket>/<name>` so a wipe
 * (`/AuraMind/`) removes user data without touching other Puter apps
 * the user has installed. Buckets we currently consume:
 *   - `backups/` — full deck JSON dumps with timestamp filenames.
 *   - `covers/` — txt2img deck cover blobs.
 *   - `study-materials/` — uploaded PDFs + extracted text (future).
 */

import { loadPuterModule } from '../puterProvider';
import { PuterFsError } from './types';

function isPuterEnabled() {
  return ((import.meta as any).env?.VITE_USE_PUTER ?? 'true') === 'true';
}

export const AURAMIND_ROOT = '/AuraMind' as const;

async function sdk(): Promise<any> {
  return loadPuterModule();
}

/** Assert the SDK is loaded; throws PuterFsError with isAuthRequired if not. */
async function fs(): Promise<any> {
  if (!isPuterEnabled()) {
    throw new PuterFsError('Puter disabled.', { puterMessage: 'disabled' });
  }
  const puter = await sdk();
  const ok = Boolean(puter?.auth?.isSignedIn?.());
  if (!ok) {
    throw new PuterFsError('Puter FS requires a signed-in Puter session.', {
      isPathNotFound: false,
      puterMessage: 'not-signed-in',
    });
  }
  if (!puter?.fs) {
    throw new PuterFsError('Puter FS SDK not available.', { puterMessage: 'no-fs' });
  }
  return puter.fs;
}

function pathOf(...segments: string[]): string {
  return segments.join('/').replace(/\/+/g, '/');
}

/** mkdir -p semantics; idempotent — exists-already is not an error. */
export async function ensureDir(path: string): Promise<void> {
  const puterFs = await fs();
  try {
    await puterFs.mkdir(path);
  } catch (e: any) {
    const msg = e?.message || '';
    // Quietly ignore "already exists" / "file exists" — mkdir is idempotent.
    if (/exists|already/i.test(msg)) return;
    const quotaHit = /quota|rate.?limit|cap/.test(msg.toLowerCase());
    throw new PuterFsError(`mkdir(${path}) failed: ${msg}`, {
      isFsQuotaExceeded: quotaHit,
      puterMessage: msg,
    });
  }
}

/** Write a UTF-8 string (or JSON-stringified object) to a path. */
export async function writeText(
  fullPath: string,
  data: string | { toString(): string } | object,
): Promise<void> {
  const puterFs = await fs();
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  try {
    await puterFs.write(fullPath, content);
  } catch (e: any) {
    const msg = e?.message || String(e);
    const quotaHit = /quota|rate.?limit|cap/.test(msg.toLowerCase());
    throw new PuterFsError(`write(${fullPath}) failed: ${msg}`, {
      isFsQuotaExceeded: quotaHit,
      puterMessage: msg,
    });
  }
}

/** Read a text file. Returns null if not found. */
export async function readText(fullPath: string): Promise<string | null> {
  try {
    const puterFs = await fs();
    const out = await puterFs.read(fullPath);
    if (typeof out === 'string') return out;
    if (out && typeof out.text === 'function') return await out.text();
    if (out && typeof out.arrayBuffer === 'function') {
      const buf = await out.arrayBuffer();
      return new TextDecoder().decode(new Uint8Array(buf));
    }
    return String(out ?? '');
  } catch (e: any) {
    const msg = e?.message || '';
    if (/not[\s_-]?found|missing|404|no such/i.test(msg)) return null;
    throw new PuterFsError(`read(${fullPath}) failed: ${msg}`, {
      isPathNotFound: /not found|no such/i.test(msg),
      puterMessage: msg,
    });
  }
}

/** List a directory. Returns [] if not found. */
export async function readDir(fullPath: string): Promise<string[]> {
  try {
    const puterFs = await fs();
    const out = await puterFs.readdir(fullPath);
    return Array.isArray(out) ? out.map(i => i?.name ?? i?.path ?? String(i)).filter(Boolean) : [];
  } catch (e: any) {
    const msg = e?.message || '';
    if (/not[\s_-]?found|missing|404|no such/i.test(msg)) return [];
    throw new PuterFsError(`readdir(${fullPath}) failed: ${msg}`, { puterMessage: msg });
  }
}

/** Delete a file or directory. Idempotent. */
export async function remove(fullPath: string): Promise<boolean> {
  const puterFs = await fs();
  try {
    if (typeof puterFs.unlink === 'function') return Boolean(await puterFs.unlink(fullPath));
    if (typeof puterFs.delete === 'function') return Boolean(await puterFs.delete(fullPath));
    return false;
  } catch (e: any) {
    const msg = e?.message || '';
    if (/not[\s_-]?found/i.test(msg)) return false;
    throw new PuterFsError(`unlink(${fullPath}) failed: ${msg}`, { puterMessage: msg });
  }
}

/** Check existence cheaply. */
export async function exists(fullPath: string): Promise<boolean> {
  try {
    const puterFs = await fs();
    if (typeof puterFs.exists === 'function') return Boolean(await puterFs.exists(fullPath));
    // No direct existence probe — fall back to a try/list.
    const dir = fullPath.replace(/\/[^/]+$/, '');
    const name = fullPath.split('/').pop() ?? '';
    if (dir === fullPath) return false;
    const list = await readDir(dir);
    return list.includes(name);
  } catch {
    return false;
  }
}

/** Rename / move a path. */
export async function rename(srcPath: string, dstPath: string): Promise<boolean> {
  const puterFs = await fs();
  try {
    return Boolean(await puterFs.rename(srcPath, dstPath));
  } catch (e: any) {
    throw new PuterFsError(`rename(${srcPath} → ${dstPath}) failed: ${e?.message ?? ''}`, {
      puterMessage: e?.message,
    });
  }
}

/** Copy a path (file or directory tree). */
export async function copy(srcPath: string, dstPath: string): Promise<boolean> {
  const puterFs = await fs();
  try {
    if (typeof puterFs.copy === 'function') return Boolean(await puterFs.copy(srcPath, dstPath));
    return false;
  } catch (e: any) {
    throw new PuterFsError(`copy(${srcPath} → ${dstPath}) failed: ${e?.message ?? ''}`, {
      puterMessage: e?.message,
    });
  }
}

/**
 * Upload a browser File / Blob into Puter FS. Used for profile pics,
 * deck covers, and user-provided PDFs (future).
 */
export async function upload(input: File | Blob, path: string): Promise<string> {
  const puterFs = await fs();
  try {
    if (typeof puterFs.upload === 'function') {
      await puterFs.upload(input, path);
      return path;
    }
    // Fall back to write() with a Blob arg if the runtime supports it.
    await puterFs.write(path, input);
    return path;
  } catch (e: any) {
    const msg = e?.message || '';
    const quotaHit = /quota|rate.?limit|cap/i.test(msg);
    throw new PuterFsError(`upload(${path}) failed: ${msg}`, {
      isFsQuotaExceeded: quotaHit,
      puterMessage: msg,
    });
  }
}

/**
 * Buckets we own. Exported so consumers (backups, covers, host names)
 * don't accidentally write to the wrong folder.
 */
export const FS_BUCKETS = {
  backups: pathOf(AURAMIND_ROOT, 'backups'),
  covers: pathOf(AURAMIND_ROOT, 'covers'),
  studyMaterials: pathOf(AURAMIND_ROOT, 'study-materials'),
  profilePictures: pathOf(AURAMIND_ROOT, 'avatars'),
} as const;
