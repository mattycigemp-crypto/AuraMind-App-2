import { describe, expect, it } from 'vitest';

import { calculateSRS, getInitialCardState } from '../services/study/srs';
import { Rating } from '../types';

describe('srs helpers', () => {
  it('creates a new card in the expected initial review state', () => {
    const card = getInitialCardState('deck-1', 'Question?', 'Answer.');

    expect(card.deckId).toBe('deck-1');
    expect(card.question).toBe('Question?');
    expect(card.answer).toBe('Answer.');
    expect(card.interval).toBe(0);
    expect(card.repetition).toBe(0);
    expect(card.easeFactor).toBe(2.5);
  });

  it('advances repetition and interval after a successful review', () => {
    const card = getInitialCardState('deck-1', 'Question?', 'Answer.');
    const result = calculateSRS(card, Rating.GOOD);

    expect(result.interval).toBe(1);
    expect(result.repetition).toBe(1);
    expect(result.easeFactor).toBe(2.5);
  });
});
