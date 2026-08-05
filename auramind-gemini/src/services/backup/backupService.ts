/**
 * backupService — backup & restore user decks to Puter FS.
 *
 * Flow
 *   1. User clicks "Back up to Puter Cloud" (CardsDecks header).
 *   2. backupDecksToPuter({decks, cards}) serialises to JSON and writes
 *      to `/AuraMind/backups/auramind-YYYY-MM-DDTHH-MM-SS.json`.
 *   3. Returns the file path so the UI can show it in a toast.
 *   4. listBackups() reads the directory so the Settings → Backup page
 *      can show "Last 5 backups with sizes".
 *   5. restoreFromBackup(path) reads + returns — the caller decides
 *      whether to merge or overwrite their local decks.
 *
 * Why this matters
 *   - Supabase data can be wiped by accident; this is the user's
 *     PERMANENT local copy.
 *   - Cross-device: a user swapping computers can "Log in with Puter,
 *     click Restore" and pick up exactly where they left off.
 *   - Cheap: each deck dump is <10 kB JSON. Free Puter tier is fine.
 */

import { writeText, readText, readDir, ensureDir, FS_BUCKETS, PuterFsError } from '../api/puter';

export interface DeckRef {
  id: string;
  title: string;
  description?: string;
  is_public?: boolean;
  created_at?: string;
}

export interface CardRef {
  id: string;
  deckId: string;
  question?: string;
  front?: string;
  answer?: string;
  back?: string;
  nextReview?: number;
  lapses?: number;
}

export interface BackupPayload {
  schemaVersion: 1;
  exportedAt: string;
  decks: DeckRef[];
  cards: CardRef[];
}

export interface BackupFile {
  path: string;
  /** Best-effort size — Puter stat may not return one; we sometimes fake it. */
  size: number | null;
  when: 'unknown' | Date;
}

/** Stable filename: my-backup-YYYYMMDD-HHMMSS.json (UTC). */
function backupFilename(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `auramind-${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate(),
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}.json`;
}

/** Backup the user's deck+card slice to Puter FS. */
export async function backupDecksToPuter(input: {
  decks: DeckRef[];
  cards: CardRef[];
}): Promise<BackupFile> {
  await ensureDir(FS_BUCKETS.backups);
  const payload: BackupPayload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    decks: input.decks,
    cards: input.cards,
  };
  const path = `${FS_BUCKETS.backups}/${backupFilename()}`;
  await writeText(path, payload);
  return { path, size: JSON.stringify(payload).length, when: new Date() };
}

/** Read all backup filenames in chronological order (newest first). */
export async function listBackups(): Promise<BackupFile[]> {
  const names = await readDir(FS_BUCKETS.backups);
  const list: BackupFile[] = [];
  for (const name of names) {
    if (!name.startsWith('auramind-') || !name.endsWith('.json')) continue;
    list.push({ path: `${FS_BUCKETS.backups}/${name}`, size: null, when: 'unknown' });
  }
  // Sort newest-first by lex (works for the YYYY-MM-DD-HHMMSS naming).
  return list.sort((a, b) => b.path.localeCompare(a.path));
}

/**
 * Restore a backup. Returns parsed payload — caller decides merge vs
 * overwrite policy. If the file is missing or unreadable, returns null.
 */
export async function restoreFromBackup(path: string): Promise<BackupPayload | null> {
  const text = await readText(path);
  if (!text) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as { schemaVersion?: unknown }).schemaVersion !== 1
  ) {
    throw new PuterFsError(`Backup at ${path} is not a v1 schema; refusing to parse.`, {});
  }
  return parsed as BackupPayload;
}
