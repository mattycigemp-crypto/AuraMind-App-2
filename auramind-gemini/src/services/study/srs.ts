import { Card, Rating, SRSResult } from '../../types';

/**
 * SuperMemo-2 (SM-2) Algorithm implementation
 * 
 * @param card Current card state
 * @param quality User rating (0-5)
 * @returns New SRS state
 */
export const calculateSRS = (card: Card, quality: Rating): SRSResult => {
  let { interval, repetition, easeFactor } = card;

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return { interval, repetition, easeFactor };
};

export const getInitialCardState = (deckId: string, question: string, answer: string): Card => {
  return {
    id: crypto.randomUUID(),
    deckId,
    question,
    answer,
    nextReview: Date.now(),
    interval: 0,
    easeFactor: 2.5,
    repetition: 0,
  };
};
