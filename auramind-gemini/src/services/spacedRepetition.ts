// SM-2 Spaced Repetition Algorithm Implementation
// Based on the algorithm by Piotr Wozniak (1987)
// Reference: https://www.supermemo.com/en/archives1990-english/ol/sm2

export interface SM2Card {
  id: string;
  easeFactor: number;      // EF - How easy the card is (starts at 2.5)
  interval: number;        // I - Days until next review
  repetition: number;      // n - Number of successful reviews
  nextReview: Date;        // When to show the card next
  lastReview: Date | null; // Last review date
}

// Quality ratings for SM-2
export enum SM2Quality {
  COMPLETE_BLACKOUT = 0,      // Complete blackout
  INCORRECT_REMEMBERED = 1,   // Incorrect; the correct one remembered
  INCORRECT_EASY = 2,         // Incorrect; the correct one seemed easy to recall
  CORRECT_DIFFICULT = 3,      // Correct response recalled with serious difficulty
  CORRECT_HESITATION = 4,     // Correct response after a hesitation
  PERFECT = 5                // Perfect response
}

// Calculate the next review interval based on SM-2 algorithm
export const calculateNextReview = (
  quality: SM2Quality,
  currentCard: SM2Card
): SM2Card => {
  let { easeFactor, interval, repetition } = currentCard;

  // If quality < 3, reset the repetition (failed card)
  if (quality < 3) {
    repetition = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  }

  // Update ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const efChange = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.max(1.3, easeFactor + efChange); // Minimum EF is 1.3

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...currentCard,
    easeFactor,
    interval,
    repetition,
    nextReview,
    lastReview: new Date()
  };
};

// Create a new card with default SM-2 values
export const createSM2Card = (id: string): SM2Card => ({
  id,
  easeFactor: 2.5,
  interval: 0,
  repetition: 0,
  nextReview: new Date(),
  lastReview: null
});

// Check if a card is due for review
export const isCardDue = (card: SM2Card): boolean => {
  return new Date() >= card.nextReview;
};

// Get cards due for review from a list
export const getDueCards = (cards: SM2Card[]): SM2Card[] => {
  const now = new Date();
  return cards.filter(card => card.nextReview <= now);
};

// Sort cards by priority (most overdue first)
export const sortByPriority = (cards: SM2Card[]): SM2Card[] => {
  return [...cards].sort((a, b) => {
    // Cards with failed reviews (repetition 0) come first
    if (a.repetition === 0 && b.repetition !== 0) return -1;
    if (b.repetition === 0 && a.repetition !== 0) return 1;

    // Then sort by next review date (most overdue first)
    return a.nextReview.getTime() - b.nextReview.getTime();
  });
};

// Calculate retention rate based on review history
export const calculateRetentionRate = (cards: SM2Card[]): number => {
  if (cards.length === 0) return 0;

  const totalRepetitions = cards.reduce((sum, card) => sum + card.repetition, 0);
  const successfulReviews = cards.filter(card => card.repetition > 0).length;

  return successfulReviews / cards.length * 100;
};

// Get statistics for a card set
export interface CardSetStats {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;
  matureCards: number;
  averageEaseFactor: number;
  retentionRate: number;
}

export const getCardSetStats = (cards: SM2Card[]): CardSetStats => {
  const now = new Date();

  const dueCards = cards.filter(card => card.nextReview <= now);
  const newCards = cards.filter(card => card.repetition === 0);
  const learningCards = cards.filter(card => card.repetition > 0 && card.repetition < 3);
  const matureCards = cards.filter(card => card.repetition >= 3);

  const averageEaseFactor = cards.length > 0
    ? cards.reduce((sum, card) => sum + card.easeFactor, 0) / cards.length
    : 2.5;

  return {
    totalCards: cards.length,
    dueCards: dueCards.length,
    newCards: newCards.length,
    learningCards: learningCards.length,
    matureCards: matureCards.length,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
    retentionRate: calculateRetentionRate(cards)
  };
};

// Map user-friendly rating to SM-2 quality
export const mapRatingToQuality = (rating: 'again' | 'hard' | 'good' | 'easy'): SM2Quality => {
  switch (rating) {
    case 'again': return SM2Quality.INCORRECT_REMEMBERED;
    case 'hard': return SM2Quality.CORRECT_DIFFICULT;
    case 'good': return SM2Quality.CORRECT_HESITATION;
    case 'easy': return SM2Quality.PERFECT;
    default: return SM2Quality.CORRECT_HESITATION;
  }
};

// Persist card data to localStorage
export const saveCardData = (deckId: string, cards: SM2Card[]): void => {
  if (typeof window === 'undefined') return;
  const key = `auramind_sm2_${deckId}`;
  localStorage.setItem(key, JSON.stringify(cards));
};

// Load card data from localStorage
export const loadCardData = (deckId: string): SM2Card[] | null => {
  if (typeof window === 'undefined') return null;
  const key = `auramind_sm2_${deckId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

// Initialize cards for a deck from existing cards
export const initializeCardsFromDeck = (deckId: string, existingCards: { id: string }[]): SM2Card[] => {
  const savedCards = loadCardData(deckId);

  if (savedCards && savedCards.length > 0) {
    // Merge existing cards with saved SM2 data
    const savedMap = new Map(savedCards.map(c => [c.id, c]));
    return existingCards.map(card => savedMap.get(card.id) || createSM2Card(card.id));
  }

  // Create new SM2 cards for all deck cards
  return existingCards.map(card => createSM2Card(card.id));
};


