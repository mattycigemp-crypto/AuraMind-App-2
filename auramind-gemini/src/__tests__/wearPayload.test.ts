import { describe, it, expect } from 'vitest';
import { buildReviewPayload, wireRatingToAppRating } from '../services/wear/wearPayload';
import type { Card } from '../types';
import { Rating } from '../types';

const card = (id: string, front: string, back: string): Card => ({
  id, deckId: 'd1', front, back, repetition: 0, nextReview: 0, lastReviewed: 0,
} as Card);

describe('buildReviewPayload', () => {
  it('caps cards at WEAR_MAX_CARDS', () => {
    const cards = Array.from({ length: 60 }, (_, i) => card(`c${i}`, 'q', 'a'));
    const p = buildReviewPayload({ cards, streak: 5, reviewedToday: 2, dueCount: 60 });
    expect(p.cards).toHaveLength(40);
    expect(p.dueCount).toBe(60);
  });

  it('truncates long front/back to 200 chars', () => {
    const long = 'x'.repeat(500);
    const p = buildReviewPayload({ cards: [card('c1', long, long)], streak: 0, reviewedToday: 0, dueCount: 1 });
    expect(p.cards[0].front).toHaveLength(200);
    expect(p.cards[0].back).toHaveLength(200);
  });

  it('sets version and a non-empty sessionId', () => {
    const p = buildReviewPayload({ cards: [], streak: 0, reviewedToday: 0, dueCount: 0 });
    expect(p.version).toBe(1);
    expect(p.sessionId.length).toBeGreaterThan(0);
  });
});

describe('wireRatingToAppRating', () => {
  it('maps 0..3 to the Rating enum', () => {
    expect(wireRatingToAppRating(0)).toBe(Rating.AGAIN);
    expect(wireRatingToAppRating(1)).toBe(Rating.HARD);
    expect(wireRatingToAppRating(2)).toBe(Rating.GOOD);
    expect(wireRatingToAppRating(3)).toBe(Rating.EASY);
  });
});
