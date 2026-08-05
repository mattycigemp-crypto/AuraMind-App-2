/**
 * coverImageService — domain wrapper over `puter.ai.txt2img`.
 *
 * Why a wrapper instead of raw generateTxt2Img calls
 *   - Generates a *topic-aware* prompt rather than passing the raw topic.
 *     "Photosynthesis" → "Cinematic 16:9 educational poster: green leaf
 *     with chloroplasts, softlight, vibrant but scientific".
 *   - Returns BOTH a session URL (for instant preview) AND an optional
 *     uploaded path on Puter FS (for cross-device reuse).
 *   - Debounces repeat generations for the same topic via the underlying
 *     `generateTxt2Img` in-memory cache.
 *
 * Where this is wired today
 *   - `CardsDecks.tsx` AI Magic form: optional "Generate cover image"
 *     button + inline preview that fades into the new-deck header.
 *
 * Future use
 *   - Marketplace deck cards: marketplace list rows could pin a generated
 *     image to the deck title for visual scannability.
 */

import {
  generateTxt2Img,
  upload,
  PuterFsError,
  PuterAiImageError,
  FS_BUCKETS,
} from '../api/puter';

export interface DeckCoverResult {
  /** Object URL — usable in <img src=...> for instant preview. */
  sourceUrl: string;
  /** Puter FS path where the image was uploaded; null if upload was skipped or failed. */
  uploadedPath: string | null;
  /** True if the underlying Puter SDK had this image cached. */
  fromCache: boolean;
}

/**
 * Build a quality prompt from a raw topic. Keeps the topic semantically
 * intact while adding visual-lexicon tokens the diffusers respect.
 */
function buildCoverPrompt(topic: string): string {
  const cleaned = topic.replace(/<[^>]+>/g, '').slice(0, 140);
  return [
    `Educational illustration for "${cleaned}".`,
    `Clean editorial style, soft cinematic lighting, no text, no human faces, modern colour palette, 512×512 square.`,
  ].join(' ');
}

/**
 * generateDeckCover — produce a cover image for a topic. Auto-uploads
 * to `/AuraMind/covers/<slug>.png` so cross-device reuse is one read away.
 *
 * Note on URL ownership: `sourceUrl` is owner-local (blob:) and is
 * invalidated the moment the page navigates away OR `clearTxt2ImgCache()`
 * fires. Callers should treat it as ephemeral preview-only storage.
 */
export async function generateDeckCover(topic: string): Promise<DeckCoverResult> {
  if (!topic?.trim()) {
    throw new PuterAiImageError('Cover needs a non-empty topic.', {});
  }
  const prompt = buildCoverPrompt(topic);
  const img = await generateTxt2Img(prompt, { width: 512, height: 512 });
  let uploadedPath: string | null = null;
  try {
    const safe = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    const dest = `${FS_BUCKETS.covers}/${safe || 'untitled'}.png`;
    const blob = await (await fetch(img.sourceUrl)).blob();
    uploadedPath = await upload(blob, dest);
  } catch (e) {
    // Don't fail the whole call if the upload fails; keep the preview
    // URL as ephemeral. log + swallow.
    if (e instanceof PuterFsError) {
      // eslint-disable-next-line no-console
      console.info(`[coverImageService] FS upload failed but preview is OK:`, e.message);
    }
  }
  return { sourceUrl: img.sourceUrl, uploadedPath, fromCache: img.fromCache };
}
