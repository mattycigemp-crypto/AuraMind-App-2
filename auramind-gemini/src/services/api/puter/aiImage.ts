/**
 * puter.ai.txt2img wrapper — generate cover-art / mnemonic images.
 *
 * Use cases in AuraMind
 * ────────────────────
 *   1. Deck cover art: when a user creates an AI deck on a topic they
 *      care about (e.g. "Quantum mechanics"), generate a 512×512
 *      illustrative banner. Displayed at the top of the deck header.
 *   2. Concept mnemonic: in a future iteration, generate a thumbnail
 *      for an individual card via `puter.img2txt(file → prompt)`.
 *
 * Cost awareness
 * ──────────────
 *   - txt2img is ~10–30 seconds per call; we expose an explicit
 *     `generateTxt2Img(prompt, opts?)` rather than fire-and-forget.
 *   - We cache the result in an in-memory Map keyed on `topic|prompt`
 *     so rapid consecutive calls in the same session dedupe.
 *   - Quota and content-block errors propagate as `PuterAiImageError`,
 *     distinguishable from kV/fs so the UI can branch.
 */

import { loadPuterModule } from '../puterProvider';
import { PuterAiImageError } from './types';

function isPuterEnabled() {
  return ((import.meta as any).env?.VITE_USE_PUTER ?? 'true') === 'true';
}

interface Txt2ImgOptions {
  width?: number;
  height?: number;
  model?: string;
}

export interface Txt2ImgResult {
  sourceUrl: string;
  /** True if the image came from the in-memory session cache (saves a network round-trip). */
  fromCache: boolean;
}

/**
 * In-memory session cache for card-cover generation. Keyed on
 * `model|prompt|widthxheight` so a re-generation of the same deck-cover
 * prompt dedupes during one session. (Persistent cache lives in FS.)
 */
const memoryCache = new Map<string, string>();

function cacheKey(prompt: string, opts: Txt2ImgOptions): string {
  return [opts.model ?? 'puter-default', prompt, `${opts.width ?? '?'}x${opts.height ?? '?'}`].join('|');
}

/**
 * generateTxt2Img — produce an image from a prompt and return a usable
 * object URL (blob: or data:).
 *
 * The returned URL is owner-local; callers who want to persist the
 * image should call `upload(imageBlob, puterFs.covers/<id>.png)` after
 * generation, then store the file path in their own DB.
 */
export async function generateTxt2Img(
  prompt: string,
  opts: Txt2ImgOptions = {},
): Promise<Txt2ImgResult> {
  if (!isPuterEnabled()) {
    throw new PuterAiImageError('Puter disabled.', { puterMessage: 'disabled' });
  }
  if (!prompt?.trim()) {
    throw new PuterAiImageError('generateTxt2Img requires a non-empty prompt.', {});
  }
  const key = cacheKey(prompt, opts);
  if (memoryCache.has(key)) {
    return { sourceUrl: memoryCache.get(key)!, fromCache: true };
  }

  const puter = await loadPuterModule();
  if (typeof puter?.ai?.txt2img !== 'function') {
    throw new PuterAiImageError('Puter.ai.txt2img not available in this SDK build.', {});
  }
  if (!puter.auth?.isSignedIn?.()) {
    throw new PuterAiImageError('Puter.ai.txt2img requires a signed-in Puter session.', {});
  }
  try {
    const img = await puter.ai.txt2img(prompt, {
      width: opts.width ?? 512,
      height: opts.height ?? 512,
      ...(opts.model ? { model: opts.model } : {}),
    });
    const url = await toObjectURL(img);
    memoryCache.set(key, url);
    return { sourceUrl: url, fromCache: false };
  } catch (e: any) {
    const msg = e?.message || String(e);
    const blocked = /(?:safety|policy|blocked|content)/i.test(msg);
    throw new PuterAiImageError(`txt2img failed: ${msg}`, {
      isContentBlocked: blocked,
      puterMessage: msg,
    });
  }
}

/**
 * Convert the various shapes `puter.ai.txt2img` can return into a single
 * object URL we can attach to `<img src=...>`.
 *   - string         → treat as URL
 *   - HTMLImageElement → canvas → blob URL
 *   - Blob / File    → blob URL
 *   - ArrayBuffer / Uint8Array → blob URL
 *   - object with `.src` / `.url` → prefer that
 */
async function toObjectURL(image: unknown): Promise<string> {
  if (typeof image === 'string') return image;
  if (
    typeof HTMLImageElement !== 'undefined' &&
    image instanceof HTMLImageElement
  ) {
    const cnv = document.createElement('canvas');
    cnv.width = image.naturalWidth || 512;
    cnv.height = image.naturalHeight || 512;
    const ctx = cnv.getContext('2d');
    if (ctx) ctx.drawImage(image, 0, 0, cnv.width, cnv.height);
    return new Promise<string>((resolve, reject) => {
      cnv.toBlob((blob) => {
        if (blob) resolve(URL.createObjectURL(blob));
        else reject(new PuterAiImageError('txt2img: canvas toBlob returned null', {}));
      }, 'image/png');
    });
  }
  if (image instanceof Blob || (typeof File !== 'undefined' && image instanceof File)) {
    return URL.createObjectURL(image as Blob);
  }
  if (image instanceof ArrayBuffer) {
    return URL.createObjectURL(new Blob([image]));
  }
  if (image && typeof (image as any).src === 'string') {
    return (image as any).src;
  }
  if (image && typeof (image as any).url === 'string') {
    return (image as any).url;
  }
  throw new PuterAiImageError('txt2img returned an unrecognised shape; cannot convert to URL.', {});
}

/** Clear the in-memory session cache (used when user signs out). */
export function clearTxt2ImgCache(): void {
  for (const url of memoryCache.values()) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
  memoryCache.clear();
}
