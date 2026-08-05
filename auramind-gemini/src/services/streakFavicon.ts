/**
 * streakFavicon — swap the tab favicon based on the user's current streak.
 *
 * Implementation: we pre-compute 5 static SVGs (one per tier) and serve
 * them from /favicons,logos/streak/{tier}.svg. On applyStreak() we inject
 * a fresh <link rel="icon"> with a cache-busting query string so browsers
 * actually re-load it (per design review D — query-string cache-busting
 * is the only reliable way across Chrome/Safari/Firefox).
 *
 * Tiers:
 *   0          — dormant (no streak yet)
 *   1..2       — early (faint glow)
 *   3..6       — on it (amber tint)
 *   7..29      — strong (violet ring)
 *   30..99     — elite (pink halo)
 *   100+       — legendary (full rainbow)
 */

export type StreakTier = 0 | 1 | 2 | 3 | 4 | 5;

const TIER_TO_INDEX: Record<StreakTier, number> = {
  0: 0, 1: 1, 2: 1, 3: 2, 4: 3, 5: 4,
};

const TIER_PATHS: Record<StreakTier, string> = {
  0: '/favicons,logos/streak/0.svg',
  1: '/favicons,logos/streak/3.svg',
  2: '/favicons,logos/streak/3.svg',
  3: '/favicons,logos/streak/14.svg',
  4: '/favicons,logos/streak/30.svg',
  5: '/favicons,logos/streak/100.svg',
};

const TIER_LABELS: Record<StreakTier, string> = {
  0: 'dormant',
  1: 'early',
  2: 'early',
  3: 'on it',
  4: 'elite',
  5: 'legendary',
};

function tierForStreak(days: number | undefined | null): StreakTier {
  if (!days || days < 1) return 0;
  if (days < 3) return 1;
  if (days < 7) return 2;
  if (days < 14) return 3;
  if (days < 30) return 3;
  if (days < 100) return 4;
  return 5;
}

let lastAppliedTier: number = -1;
let lastAppliedStreak: number | null | undefined = -1;

interface ApplyOptions {
  /** Current consecutive-day streak (0 if unknown). */
  streakDays?: number | null;
  /** Force reapply even when nothing changed. */
  force?: boolean;
}

/**
 * applyStreak — set the favicon to match the current streak.
 * Returns the tier applied so callers can show a subtle toast/badge.
 */
export function applyStreak(opts: ApplyOptions = {}): StreakTier {
  if (typeof window === 'undefined') return 0;
  const tier = tierForStreak(opts.streakDays);
  const idx = TIER_TO_INDEX[tier];
  if (!opts.force && idx === lastAppliedTier && opts.streakDays === lastAppliedStreak) return tier;

  const href = `${TIER_PATHS[tier]}?v=${idx}`;
  // Remove any previously injected streak favicons so we don't accumulate
  // ghost <link> tags.
  document.querySelectorAll('link[data-favicon-tier]').forEach((n) => n.remove());

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  link.dataset.faviconTier = String(idx);
  document.head.appendChild(link);

  // Mirror to apple-touch-icon so iOS home-screen shortcut updates too.
  const apple = document.createElement('link');
  apple.rel = 'apple-touch-icon';
  apple.href = href;
  apple.dataset.faviconTier = String(idx);
  document.head.appendChild(apple);

  lastAppliedTier = idx;
  lastAppliedStreak = opts.streakDays;
  return tier;
}

export { tierForStreak, TIER_LABELS, TIER_PATHS };
