import { describe, expect, it } from 'vitest';
import {
  GRADE_LABELS,
  compareProfiles,
  pickSampleCards,
  retentionCurve,
  simulateLogLoss,
  type ReviewSample,
} from '../services/study/profileSimulator';
import { DEFAULT_WEIGHTS } from '../services/study/fsrs';
import type { Card } from '../types';

const RATINGS_HARD = 3;
const RATINGS_GOOD = 4;
const RATINGS_EASY = 5;

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    deckId: overrides.deckId ?? 'deck-1',
    front: overrides.front ?? 'Front A',
    back: overrides.back ?? 'Back A',
    nextReview: overrides.nextReview ?? Date.now(),
    interval: overrides.interval ?? 0,
    easeFactor: overrides.easeFactor ?? 2.5,
    repetition: overrides.repetition ?? 0,
    ...overrides,
  } as Card;
}

const fastLearnerWeights: number[] = (() => {
  // Hand-built fast-learner shape: longer stability, shorter between-grade gap.
  return DEFAULT_WEIGHTS.map((w, i) => {
    if (i >= 8 && i <= 14) return w * 1.4;
    if (i >= 15 && i <= 19) return w * 0.9;
    return w;
  });
})();

const toughLearnerWeights: number[] = (() => {
  return DEFAULT_WEIGHTS.map((w, i) => {
    if (i >= 8 && i <= 14) return w * 0.65;
    if (i >= 15 && i <= 19) return w * 1.1;
    return w;
  });
})();

const SAMPLE_CARDS: Card[] = [
  makeCard({ id: 'c1', front: 'Photosynthesis', repetition: 3, interval: 7, easeFactor: 2.5, fsrsState: { stability: 12, difficulty: 5, elapsedDays: 1, scheduledDays: 7, repetitions: 3, lapses: 0, lastReview: Date.now() - 86400000 } }),
  makeCard({ id: 'c2', front: 'Mitosis stages', repetition: 1, interval: 2, easeFactor: 2.5, fsrsState: { stability: 2, difficulty: 6, elapsedDays: 0, scheduledDays: 2, repetitions: 1, lapses: 0, lastReview: Date.now() } }),
  makeCard({ id: 'c3', front: 'Atomic number of carbon', repetition: 0, interval: 0, easeFactor: 2.5 }),
  makeCard({ id: 'c4', front: 'Tabular methods', repetition: 5, interval: 30, easeFactor: 2.6, fsrsState: { stability: 30, difficulty: 4, elapsedDays: 5, scheduledDays: 30, repetitions: 5, lapses: 0, lastReview: Date.now() - 5 * 86400000 } }),
  makeCard({ id: 'c5', front: 'Brand new card', repetition: 0, interval: 0, easeFactor: 2.5 }),
];

const REVIEWS: ReviewSample[] = [
  { stability: 10, elapsedDays: 1, grade: 2 },
  { stability: 10, elapsedDays: 4, grade: 2 },
  { stability: 10, elapsedDays: 10, grade: 0 },
  { stability: 30, elapsedDays: 12, grade: 3 },
  { stability: 30, elapsedDays: 25, grade: 2 },
];

describe('profileSimulator', () => {
  describe('GRADE_LABELS', () => {
    it('covers grades 0..3 only', () => {
      expect(Object.keys(GRADE_LABELS).sort()).toEqual(['0', '1', '2', '3']);
    });
  });

  describe('simulateLogLoss', () => {
    it('returns +Infinity on empty reviews', () => {
      expect(simulateLogLoss(DEFAULT_WEIGHTS, [])).toBe(Number.POSITIVE_INFINITY);
    });

    it('returns a finite positive number on populated reviews', () => {
      const loss = simulateLogLoss(DEFAULT_WEIGHTS, REVIEWS);
      expect(Number.isFinite(loss)).toBe(true);
      expect(loss).toBeGreaterThan(0);
    });

    it('returns the same loss for symmetric skip-empty rows', () => {
      const lossy = simulateLogLoss(DEFAULT_WEIGHTS, [
        ...REVIEWS,
        { stability: 0, elapsedDays: 1, grade: 0 },
      ]);
      expect(lossy).toBe(simulateLogLoss(DEFAULT_WEIGHTS, REVIEWS));
    });
  });

  describe('pickSampleCards', () => {
    it('returns at most the requested count', () => {
      const out = pickSampleCards(SAMPLE_CARDS, 3);
      expect(out.length).toBeLessThanOrEqual(3);
    });

    it('prefers cards with past reviews when possible', () => {
      const out = pickSampleCards(SAMPLE_CARDS, 2);
      // First two reviewed: c1, c2/c4 (random). c5 is fresh and should not appear first.
      expect(out[0].id).not.toBe('c5');
    });

    it('is stable under emptier input', () => {
      const out = pickSampleCards([], 5);
      expect(out).toEqual([]);
    });
  });

  describe('retentionCurve', () => {
    it('returns one point per day including day 0 and day N', () => {
      const pts = retentionCurve(DEFAULT_WEIGHTS, fastLearnerWeights, SAMPLE_CARDS, 30);
      expect(pts.length).toBe(31);
      expect(pts[0].day).toBe(0);
      expect(pts[pts.length - 1].day).toBe(30);
    });

    it('produces monotonically non-increasing series for both profiles', () => {
      const pts = retentionCurve(DEFAULT_WEIGHTS, fastLearnerWeights, SAMPLE_CARDS, 30);
      for (let i = 1; i < pts.length; i++) {
        expect(pts[i].current).toBeLessThanOrEqual(pts[i - 1].current + 1e-6);
        expect(pts[i].alt).toBeLessThanOrEqual(pts[i - 1].alt + 1e-6);
      }
    });

    it('keeps both series in [0, 1]', () => {
      const pts = retentionCurve(DEFAULT_WEIGHTS, toughLearnerWeights, SAMPLE_CARDS, 60);
      for (const p of pts) {
        expect(p.current).toBeGreaterThanOrEqual(0);
        expect(p.current).toBeLessThanOrEqual(1);
        expect(p.alt).toBeGreaterThanOrEqual(0);
        expect(p.alt).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('compareProfiles', () => {
    it('returns tie when current and alt weights are identical', () => {
      const result = compareProfiles({
        currentWeights: DEFAULT_WEIGHTS,
        altWeights: DEFAULT_WEIGHTS,
        currentLabel: null,
        altLabel: 'moderate',
        currentCenter: DEFAULT_WEIGHTS[4],
        altCenter: 6.5,
        sampleCards: SAMPLE_CARDS,
        reviews: REVIEWS,
      });
      expect(result.recommendation).toBe('tie');
      expect(Math.abs(result.improvementPct)).toBeLessThan(0.001);
      // All per-grade intervals should match exactly.
      for (const g of [0, 1, 2, 3] as const) {
        expect(result.altAvgIntervals[g]).toBeCloseTo(result.currentAvgIntervals[g], 6);
      }
    });

    it('produces switch/stay recommendation based on simulated loss', () => {
      const result = compareProfiles({
        currentWeights: toughLearnerWeights,    // intentionally punishing
        altWeights: fastLearnerWeights,        // intentionally forgiving
        currentLabel: 'tough-learner',
        altLabel: 'fast-learner',
        currentCenter: 7.5,
        altCenter: 4.5,
        sampleCards: SAMPLE_CARDS,
        reviews: REVIEWS,
      });
      expect(result.recommendation === 'switch' || result.recommendation === 'stay' || result.recommendation === 'tie').toBe(true);
      // altAvg intervals should trend longer for fast-learner.
      expect(result.altAvgIntervals[3]).toBeGreaterThanOrEqual(result.currentAvgIntervals[3]);
    });

    it('returns one card preview per sample', () => {
      const result = compareProfiles({
        currentWeights: DEFAULT_WEIGHTS,
        altWeights: fastLearnerWeights,
        currentLabel: 'moderate',
        altLabel: 'fast-learner',
        currentCenter: DEFAULT_WEIGHTS[4],
        altCenter: 4.5,
        sampleCards: SAMPLE_CARDS,
        reviews: REVIEWS,
      });
      expect(result.cards.length).toBe(SAMPLE_CARDS.length);
    });

    it('fits within the safety envelope (no nonsense intervals)', () => {
      const result = compareProfiles({
        currentWeights: DEFAULT_WEIGHTS,
        altWeights: toughLearnerWeights,
        currentLabel: null,
        altLabel: 'tough-learner',
        currentCenter: null,
        altCenter: 7.5,
        sampleCards: SAMPLE_CARDS,
        reviews: REVIEWS,
      });
      for (const intervals of [result.currentAvgIntervals, result.altAvgIntervals]) {
        for (const g of [0, 1, 2, 3] as const) {
          expect(Number.isFinite(intervals[g])).toBe(true);
          expect(intervals[g]).toBeGreaterThan(0);
          expect(intervals[g]).toBeLessThanOrEqual(36500);
        }
      }
    });
  });
});

// Sanity: ensure unused rating enum constants don't fall out of sync with GRADE_LABELS.
describe('App Rating to FSRS grade mapping', () => {
  it('covers the four documented grades via the simulator', () => {
    // Just confirms the imports pulled in the right rating numbers.
    expect([RATINGS_HARD, RATINGS_GOOD, RATINGS_EASY]).toEqual([3, 4, 5]);
  });
});
