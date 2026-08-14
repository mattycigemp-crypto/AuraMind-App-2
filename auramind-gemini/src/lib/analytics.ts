import { Card, Deck } from '../types';

export const getDeckAnalytics = (decks: Deck[], cards: Card[]) =>
  decks.map((deck) => {
    const deckCards = cards.filter((card) => card.deckId === deck.id);
    const due = deckCards.filter((card) => (card.nextReview ?? 0) <= Date.now()).length;
    const mastered = deckCards.filter((card) => (card.interval || 0) >= 14 && (card.repetition || 0) >= 3).length;
    const mastery = deckCards.length === 0 ? 0 : Math.round((mastered / deckCards.length) * 100);

    return {
      ...deck,
      due,
      mastery,
      reviews: deckCards.reduce((total, card) => total + (card.repetition || 0), 0),
    };
  });

export const normalizeSeries = (values: number[], fallback = 12) =>
  (values.length ? values : [fallback, fallback, fallback, fallback, fallback, fallback, fallback]).slice(0, 7).concat(
    Array(Math.max(0, 7 - values.length)).fill(fallback)
  ).slice(0, 7);



