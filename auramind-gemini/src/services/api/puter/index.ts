/**
 * puter/ — barrel re-export of every Puter.js subsystem wrapper.
 *
 * Why a barrel?
 *   - `import { setKv, upload, generateTxt2Img } from '@/services/api/puter'`
 *     reads cleaner than three different relative paths.
 *   - Single entry point for code review: anything Puter-related fans out
 *     from here.
 *   - Future split-per-subsystem (one dir-tree per subsystem) keeps the
 *     public surface stable — barrels are how you deprecate internal
 *     paths without churning every call site.
 *
 * Modules re-exported
 *   - auth (signIn/Out, sync isSignedIn, getCurrentUser) — from puterProvider
 *   - kv  — typed key/value store with debounced writes + flushable
 *   - fs  — typed filesystem ops (read/write/mkdir/upload/etc.)
 *   - ai/* — Image generation (txt2img) wrapper + chat via puterProvider
 *   - types — typed error hierarchy (PuterUnavailableError + 4 subclasses)
 */

export {
  signInWithPuter,
  signOutPuter,
  isPuterAuthedSync,
  getPuterUser,
  loadPuterModule,
} from '../puterProvider';

export {
  PuterUnavailableError,
} from '../puterProvider';

export {
  PuterAuthError,
  PuterKvError,
  PuterFsError,
  PuterAiImageError,
} from './types';

export {
  setKv,
  getKv,
  delKv,
  flushKv,
  listKv,
} from './kv';

export {
  ensureDir,
  writeText,
  readText,
  readDir,
  remove,
  exists,
  rename,
  copy,
  upload,
  AURAMIND_ROOT,
  FS_BUCKETS,
} from './fs';

export {
  generateTxt2Img,
  clearTxt2ImgCache,
} from './aiImage';

// ───────────────────────────────────────────────────────────────────────
// Free-AI router hook
// ───────────────────────────────────────────────────────────────────────
// The freeAIRouter module imports this as the first-tier free provider.
// This thin wrapper is intentionally narrow — it returns `{text}` so the
// router can't accidentally couple to Puter's broader response shape.
import { loadPuterModule } from '../puterProvider';

export interface PuterChatRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface PuterChatResponse {
  text: string;
}

export async function puterChat(
  req: PuterChatRequest,
): Promise<PuterChatResponse> {
  const mod = await loadPuterModule().catch(() => null);
  if (!mod) {
    throw new Error('Puter runtime unavailable');
  }
  // The underlying puter.ai.chat returns a string OR an async iterable.
  // We always request a non-streaming string response here.
  const text = await mod.ai.chat(
    [
      ...(req.systemPrompt
        ? [{ role: 'system', content: req.systemPrompt }]
        : []),
      { role: 'user', content: req.prompt },
    ],
    {
      max_tokens: req.maxTokens ?? 600,
      temperature: req.temperature ?? 0.7,
      stream: false,
    },
  );
  return { text: typeof text === 'string' ? text : String(text ?? '') };
}
