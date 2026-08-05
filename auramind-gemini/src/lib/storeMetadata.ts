/**
 * Store metadata — single source of truth for App Store / Play Store /
 * Tauri bundle description text.
 *
 * Sits on top of `lib/branding.ts` so the parent (CogniVect) byline and
 * the contact addresses flow through both surfaces unchanged. A future
 * rename touches one file (branding.ts) and propagates here automatically
 * — the file-tree consumers (fastlane/metadata/en-US/description.txt,
 * store/android/listings/en-US/full_description.txt) are flat rendered
 * at install time via `scripts/render-store-metadata.mjs` (or by hand).
 *
 * Length constraints (enforced below by `assertStoreLimits` — caught by
 * `__tests__/storeMetadata.test.ts`):
 *   - App Store Connect: subtitle ≤ 30 chars, description ≤ 4000 chars,
 *     keywords ≤ 100 chars.
 *   - Google Play Console: title ≤ 30 chars, short description ≤ 80
 *     chars, full description ≤ 4000 chars.
 */

import {
  PARENT_COMPANY_NAME,
  PARENT_COMPANY_LEGAL,
  PARENT_BRAND_SLUG,
  PARENT_BRAND_TAGLINE,
  PRODUCT_NAME,
  PRODUCT_BYLINE,
  CONTACT_EMAIL,
  VENDOR_URL,
} from './branding';

/* ── Apple App Store Connect ────────────────────────────────────────── */

export const APP_STORE_NAME = PRODUCT_NAME;
export const APP_STORE_SUBTITLE = 'Study smarter, not longer';
export const APP_STORE_KEYWORDS =
  'flashcards,study,spaced repetition,AI,memory,focus,pomodoro,learning,decks,exam prep';
export const APP_STORE_PRIVACY_URL = `https://${PARENT_BRAND_SLUG.toLowerCase()}.app/privacy`;
export const APP_STORE_MARKETING_URL = `https://${PARENT_BRAND_SLUG.toLowerCase()}.app`;
export const APP_STORE_SUPPORT_URL = `https://${PARENT_BRAND_SLUG.toLowerCase()}.app/docs`;
export const APP_STORE_COPYRIGHT = `© ${PARENT_COMPANY_LEGAL}`;

/* ── Google Play Console ────────────────────────────────────────────── */

export const PLAY_STORE_TITLE = PRODUCT_NAME;
export const PLAY_STORE_SHORT_DESCRIPTION =
  'AI flashcards + FSRS spaced repetition. Study smarter, not longer.';
export const PLAY_STORE_DEVELOPER_NAME = PARENT_COMPANY_LEGAL;
export const PLAY_STORE_PRIVACY_URL = APP_STORE_PRIVACY_URL;
export const PLAY_STORE_WEBSITE_URL = APP_STORE_MARKETING_URL;
export const PLAY_STORE_CONTACT_EMAIL = CONTACT_EMAIL;

/* ── Long descriptions (≤ 4000 chars each) ──────────────────────────── */

/**
 * The full App Store long description. Apple regular App Store copy
 * can hit 4000 chars; we keep ~1900 to leave room for future
 * feature-led bullets without re-shaping the structure.
 */
export const APP_STORE_LONG_DESCRIPTION = [
  `${APP_STORE_NAME} — the flagship study platform from ${PARENT_COMPANY_NAME}, Inc.`,
  '',
  'Built for students who want to study smarter, not longer. AuraMind combines adaptive spaced repetition (FSRS), AI-assisted deck generation, and Pomodoro-style focus modes so every minute lands somewhere that matters.',
  '',
  "What's inside",
  '',
  '• ADAPTIVE SPACED REPETITION — AuraMind learns what you\'ve already mastered and what you\'ve forgotten. The FSRS scheduler reschedules each card the moment you rate it, so review sessions get shorter the more consistent you are.',
  '',
  '• AI DECK GENERATION — Paste a topic, a PDF, or a YouTube URL; AuraMind\'s AI tutor drafts a clean Q&A deck with citations. Edit what you want, delete what you don\'t. The deck is yours.',
  '',
  '• FOCUS MODE + AMBIENT PLAYLISTS — A built-in Pomodoro timer with optional ambient soundscapes (rain, cafés, lo-fi) keeps your hands on the cards and your eyes on the questions. No new tab, no new app.',
  '',
  '• STREAKS + ACHIEVEMENTS — Streaks track consistency over time, not hours-per-session. Achievement tiers (Cadet → Scholar → Sage) unlock as your retention rate stabilises above 90%.',
  '',
  '• STUDY GROUPS + LEAGUES — Compete with friends via weekly XP leaderboards, or join a public League and climb the seasonal ladder.',
  '',
  '• OFFLINE-FIRST — Decks, cards, and review history all sync to your device. You can study on a plane without changing a thing; the moment you\'re online, everything reconciles.',
  '',
  'Privacy by default',
  '',
  '• Microphone access is opt-in (voice-driven study mode only) and never enabled without the session you started it in.',
  '• No ad networks. No third-party trackers. Sentry crash reporting is anonymised before it ever leaves your device.',
  '• Your data lives in Supabase Postgres under your control. Export it any time from Settings → Privacy → Export.',
  '',
  `About ${PARENT_COMPANY_NAME}`,
  '',
  `${APP_STORE_NAME} is the first product by ${PARENT_COMPANY_NAME}, Inc — ${PARENT_BRAND_TAGLINE}. We build tools that respect your time and your attention. Visit ${VENDOR_URL} to learn more about the broader family.`,
  '',
  `${APP_STORE_COPYRIGHT}. All rights reserved.`,
].join('\n');

/**
 * Play Store long description. Mirrors the App Store copy but
 * tightens slightly to keep Google Play's "early impressions" look
 * clean — opening lines drive install rate more than bullet density.
 */
export const PLAY_STORE_LONG_DESCRIPTION = [
  `${APP_STORE_NAME} — the flagship study platform from ${PARENT_COMPANY_NAME}, Inc.`,
  '',
  'Built for students who want to study smarter, not longer. AuraMind combines adaptive spaced repetition (FSRS), AI-assisted deck generation, and Pomodoro-style focus modes so every minute lands somewhere that matters.',
  '',
  "What's inside",
  '',
  '★ ADAPTIVE SPACED REPETITION — AuraMind learns what you\'ve already mastered and what you\'ve forgotten. The FSRS scheduler reschedules each card the moment you rate it, so review sessions get shorter the more consistent you are.',
  '',
  '★ AI DECK GENERATION — Paste a topic, a PDF, or a URL; AuraMind\'s AI tutor drafts a clean Q&A deck with citations. Edit what you want, delete what you don\'t. The deck is yours.',
  '',
  '★ FOCUS MODE + AMBIENT PLAYLISTS — A built-in Pomodoro timer with ambient soundscapes (rain, cafés, lo-fi) keeps your hands on the cards and your eyes on the questions.',
  '',
  '★ STREAKS + ACHIEVEMENTS — Streaks track consistency over time, not hours-per-session. Achievement tiers (Cadet → Scholar → Sage) unlock as your retention rate stabilises above 90%.',
  '',
  '★ STUDY GROUPS + LEAGUES — Compete with friends via weekly XP leaderboards, join a public League, and climb the seasonal ladder.',
  '',
  '★ OFFLINE-FIRST — Decks, cards, and review history all sync to your device. Study on a plane; the moment you\'re online, everything reconciliates.',
  '',
  'Privacy by default',
  '',
  '✦ Microphone access is opt-in (voice-driven study mode only).',
  '✦ No ad networks. No third-party trackers. Sentry crash reporting is anonymised.',
  '✦ Your data lives in Supabase Postgres. Export it any time from Settings → Privacy → Export.',
  '',
  `About ${PARENT_COMPANY_NAME}`,
  '',
  `${APP_STORE_NAME} is the first product by ${PARENT_COMPANY_NAME}, Inc — ${PARENT_BRAND_TAGLINE}. Visit ${VENDOR_URL} to learn more about the broader family.`,
  '',
  `${APP_STORE_COPYRIGHT}. All rights reserved.`,
].join('\n');

/* ── Length-contract enforcement ────────────────────────────────────── */

const STORE_LIMITS = {
  appStoreName:                30,
  appStoreSubtitle:           30,
  appStoreKeywords:           100,
  appStoreLongDescription:    4000,
  playStoreTitle:             30,
  playStoreShortDescription:  80,
  playStoreLongDescription:   4000,
} as const;

export type StoreLimitKey = keyof typeof STORE_LIMITS;

/**
 * Assert every store-listing field stays within the platform's hard limits.
 * Throws a labelled Error so a developer running the assertion at build
 * time sees the exact field that's about to be rejected by the store.
 */
export function assertStoreLimits(): readonly { field: StoreLimitKey; length: number }[] {
  const out: { field: StoreLimitKey; length: number }[] = [];
  const checks: { field: StoreLimitKey; value: string }[] = [
    { field: 'appStoreName',               value: APP_STORE_NAME },
    { field: 'appStoreSubtitle',          value: APP_STORE_SUBTITLE },
    { field: 'appStoreKeywords',          value: APP_STORE_KEYWORDS },
    { field: 'appStoreLongDescription',   value: APP_STORE_LONG_DESCRIPTION },
    { field: 'playStoreTitle',            value: PLAY_STORE_TITLE },
    { field: 'playStoreShortDescription', value: PLAY_STORE_SHORT_DESCRIPTION },
    { field: 'playStoreLongDescription',  value: PLAY_STORE_LONG_DESCRIPTION },
  ];
  for (const { field, value } of checks) {
    const limit = STORE_LIMITS[field];
    if (value.length > limit) {
      throw new Error(
        `[storeMetadata] ${field} is ${value.length} chars; platform limit is ${limit}. Trim and re-export.`,
      );
    }
    out.push({ field, length: value.length });
  }
  return out;
}

/**
 * Same contract expressed as plain data — useful for the `vitest`
 * row-by-row snapshot in `__tests__/storeMetadata.test.ts`.
 */
export function getStoreMetadataLengths(): Readonly<Record<StoreLimitKey, { length: number; limit: number }>> {
  const lengths = assertStoreLimits();
  return Object.fromEntries(
    lengths.map(({ field, length }) => [field, { length, limit: STORE_LIMITS[field] }]),
  ) as Record<StoreLimitKey, { length: number; limit: number }>;
}

/* ── Type-level read-only mirror of the platform limits ─────────────── */

export type StoreLimits = typeof STORE_LIMITS;
export const STORE_LIMITS_OBJECT = STORE_LIMITS;

/* ── Reusable legend for the docs/SUPPORT pages ─────────────────────── */

/**
 * `PRODUCT_BYLINE` is widely used; keep the export as a stable,
 * byline-shaped helper for any UI that wants to display
 * "AuraMind — a CogniVect product".
 */
export { PRODUCT_BYLINE };
