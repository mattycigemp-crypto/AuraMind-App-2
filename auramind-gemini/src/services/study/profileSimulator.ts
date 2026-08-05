/**
 * profileSimulator — A/B compare two FSRS weight vectors against the
 * user's real cards without committing either to disk.
 *
 * Used by the Profile Compare panel at /dashboard/personalization so a
 * user can see, on their own review history, exactly what a profile
 * switch would do to:
 *   - per-grade intervals on their actual cards
 *   - the predicted 30-day forgetting curve averaged across their deck
 *   - simulated log-loss against recent review outcomes
 *
 * Pure functions only — nothing here writes to the database. The "Switch"
 * CTA in PersonalizationPage calls upsert_user_fsrs_params directly with
 * the alt weights + loss metric, but only if the alt vector beats the
 * current one (the recommendation gate).
 */

import type { Card } from '../../types';
import {
  DEFAULT_WEIGHTS,
  scheduleFSRS,
  forgettingCurve,
  getFSRSState,
} from './fsrs';

// Pretty labels keyed by FSRS grade 0..3 (Again/Hard/Good/Easy).
export type Grade = 0 | 1 | 2 | 3;
export const GRADE_LABELS: Record<Grade, string> = {
  0: 'Again',
  1: 'Hard',
  2: 'Good',
  3: 'Easy',
};
const GRADES: Grade[] = [0, 1, 2, 3];

// Map FSRS grade → app Rating enum (AGAIN=0, HARD=3, GOOD=4, EASY=5).
const GRADE_TO_RATING: Record<Grade, number> = {
  0: 0, // AGAIN
  1: 3, // HARD
  2: 4, // GOOD
  3: 5, // EASY
};

// Recommendation needs >0.5% relative loss improvement before switching.
const NEUTRAL_RECOMMENDATION_THRESHOLD = 0.005;

export interface CardSample {
  id: string;
  frontPreview: string;
  /** Prevailing stability before the hypothetical review (used by curves). */
  preStability: number;
  /** Predicted next interval under the tested weight vector per grade (days). */
  gradeIntervals: Record<Grade, number>;
  /** Stability after a "Good" rating under the tested weight vector. */
  postGoodStability: number;
}

export interface RetentionPoint {
  /** Day offset from "now" (post-review). */
  day: number;
  /** Avg retrievability across sample cards at this day, 0..1. */
  current: number;
  /** Same under alt weights. */
  alt: number;
}

export interface ReviewSample {
  stability: number;
  elapsedDays: number;
  /** 0=lapse, 1=hard, 2=good, 3=easy */
  grade: number;
}

/** Probability-of-loss helper — Forge-style Brier log-loss. */
export function simulateLogLoss(
  weights: number[],
  reviews: readonly ReviewSample[],
): number {
  if (!reviews.length) return Number.POSITIVE_INFINITY;
  const factor = weights[14] ?? DEFAULT_WEIGHTS[14];
  let loss = 0;
  let n = 0;
  for (const r of reviews) {
    if (!r.stability || !r.elapsedDays) continue;
    const predictedR = Math.pow(
      1 + (factor * r.elapsedDays) / Math.max(r.stability, 0.1),
      -1,
    );
    const actual = r.grade > 0 ? 1 : 0;
    const clipped = Math.min(0.999, Math.max(0.001, predictedR));
    loss += actual === 1 ? -Math.log(clipped) : -Math.log(1 - clipped);
    n++;
  }
  return n > 0 ? loss / n : Number.POSITIVE_INFINITY;
}

/**
 * Run a single weight vector against `sampleCards`. Returns per-card
 * predictions + averages. No retention curve here — see retentionCurve.
 */
function simulateProfile(
  weights: number[],
  sampleCards: readonly Card[],
  reviews?: readonly ReviewSample[],
): {
  avgIntervals: Record<Grade, number>;
  avgPostStability: number;
  cardSamples: CardSample[];
  loss: number;
} {
  const cardSamples: CardSample[] = sampleCards.map(card => {
    const preState = getFSRSState(card);
    const gradeIntervals = GRADES.reduce((acc, g) => {
      acc[g] = scheduleFSRS(card, GRADE_TO_RATING[g] as any, weights).interval;
      return acc;
    }, {} as Record<Grade, number>);
    const postGoodStability = scheduleFSRS(card, GRADE_TO_RATING[2] as any, weights).stability;
    return {
      id: card.id,
      frontPreview: (card.front ?? '').slice(0, 80),
      preStability: preState.stability > 0.1 ? preState.stability : DEFAULT_WEIGHTS[0],
      gradeIntervals,
      postGoodStability,
    };
  });

  const avgIntervals = GRADES.reduce((acc, g) => {
    const total = cardSamples.reduce((s, c) => s + c.gradeIntervals[g], 0);
    acc[g] = cardSamples.length > 0 ? total / cardSamples.length : 0;
    return acc;
  }, {} as Record<Grade, number>);

  const avgPostStability = cardSamples.length > 0
    ? cardSamples.reduce((s, c) => s + c.postGoodStability, 0) / cardSamples.length
    : DEFAULT_WEIGHTS[0];

  const loss = reviews ? simulateLogLoss(weights, reviews) : Number.POSITIVE_INFINITY;

  return { avgIntervals, avgPostStability, cardSamples, loss };
}

/**
 * Build a day-by-day retention curve for two weight vectors side by side.
 * Each point averages the FSRS forgetting function across all sample cards,
 * holding their pre-stability constant.
 */
export function retentionCurve(
  currentWeights: readonly number[],
  altWeights: readonly number[],
  sampleCards: readonly Card[],
  days = 30,
): RetentionPoint[] {
  const span = Math.max(7, Math.min(60, Math.round(days)));
  const factorCurrent = currentWeights[14] ?? DEFAULT_WEIGHTS[14];
  const factorAlt = altWeights[14] ?? DEFAULT_WEIGHTS[14];
  const stability = sampleCards.map(c => {
    const state = getFSRSState(c);
    return state.stability > 0.1 ? state.stability : DEFAULT_WEIGHTS[0];
  });
  const n = Math.max(1, stability.length);
  const points: RetentionPoint[] = [];
  for (let d = 0; d <= span; d++) {
    let cur = 0;
    let alt = 0;
    for (const s of stability) {
      cur += forgettingCurve(d, s, factorCurrent);
      alt += forgettingCurve(d, s, factorAlt);
    }
    points.push({ day: d, current: cur / n, alt: alt / n });
  }
  return points;
}

export interface CompareProfilesInput {
  currentWeights: number[];
  altWeights: number[];
  currentLabel: string | null;
  altLabel: string;
  currentCenter: number | null;
  altCenter: number;
  sampleCards: Card[];
  reviews?: ReviewSample[];
  /** Number of days to plot on the retention curve (default 30). */
  curveDays?: number;
}

export type Recommendation = 'switch' | 'stay' | 'tie';

export interface ComparisonResult {
  currentProfile: { label: string | null; weights: number[]; center: number | null };
  altProfile: { label: string; weights: number[]; center: number };
  currentAvgIntervals: Record<Grade, number>;
  altAvgIntervals: Record<Grade, number>;
  currentPostStability: number;
  altPostStability: number;
  currentLoss: number;
  altLoss: number;
  retention: RetentionPoint[];
  recommendation: Recommendation;
  /** Relative loss improvement (positive → alt is better). */
  improvementPct: number;
  cards: Array<{
    id: string;
    frontPreview: string;
    currentGradeIntervals: Record<Grade, number>;
    altGradeIntervals: Record<Grade, number>;
  }>;
}

/**
 * Compare two weight vectors on `sampleCards`. Single source of truth
 * for everything rendered in the Profile Compare panel.
 */
export function compareProfiles(input: CompareProfilesInput): ComparisonResult {
  const {
    currentWeights,
    altWeights,
    currentLabel,
    altLabel,
    currentCenter,
    altCenter,
    sampleCards,
    reviews,
    curveDays = 30,
  } = input;

  const cardSrc = sampleCards.filter(c => !!c.id);
  const current = simulateProfile(currentWeights, cardSrc, reviews);
  const alt = simulateProfile(altWeights, cardSrc, reviews);
  const retention = retentionCurve(currentWeights, altWeights, cardSrc, curveDays);

  const haveLosses = Number.isFinite(current.loss) && Number.isFinite(alt.loss);
  let recommendation: Recommendation = 'tie';
  if (haveLosses) {
    const delta = current.loss - alt.loss;
    if (delta > NEUTRAL_RECOMMENDATION_THRESHOLD * Math.max(current.loss, 1)) {
      recommendation = 'switch';
    } else if (-delta > NEUTRAL_RECOMMENDATION_THRESHOLD * Math.max(current.loss, 1)) {
      recommendation = 'stay';
    }
  }

  const improvementPct =
    haveLosses && current.loss > 0
      ? ((current.loss - alt.loss) / current.loss) * 100
      : 0;

  const cards = cardSrc.map((card, i) => {
    const c = current.cardSamples[i];
    const a = alt.cardSamples[i];
    return {
      id: card.id,
      frontPreview: c?.frontPreview ?? (card.front ?? '').slice(0, 80),
      currentGradeIntervals: c?.gradeIntervals ?? { 0: 0, 1: 0, 2: 0, 3: 0 },
      altGradeIntervals: a?.gradeIntervals ?? { 0: 0, 1: 0, 2: 0, 3: 0 },
    };
  });

  return {
    currentProfile: { label: currentLabel, weights: currentWeights, center: currentCenter },
    altProfile: { label: altLabel, weights: altWeights, center: altCenter },
    currentAvgIntervals: current.avgIntervals,
    altAvgIntervals: alt.avgIntervals,
    currentPostStability: current.avgPostStability,
    altPostStability: alt.avgPostStability,
    currentLoss: current.loss,
    altLoss: alt.loss,
    retention,
    recommendation,
    improvementPct,
    cards,
  };
}

/**
 * Pick a useful sample of up to N cards from the user's deck.
 * Preference: cards with at least one past review (they have stability
 * we can schedule against), then fill with fresh cards.
 */
export function pickSampleCards(cards: readonly Card[], max = 5): Card[] {
  const reviewed = cards.filter(c => getFSRSState(c).repetitions > 0);
  const fresh = cards.filter(c => getFSRSState(c).repetitions === 0);
  const shuffled = (xs: readonly Card[]) => {
    const a = xs.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return [...shuffled(reviewed), ...shuffled(fresh)].slice(0, max);
}
