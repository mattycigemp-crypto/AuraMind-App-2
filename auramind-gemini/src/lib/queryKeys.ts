/**
 * Typed query key factory.
 *
 * Centralizing keys keeps invalidations canonical — when realtime fires,
 * we always invalidate `queryKeys.decks.all` and every qualified variant
 * (list, detail, marketplace) is covered.
 *
 * Convention:
 *   - `*.all`         — invalidates everything in the namespace
 *   - `*.list(userId)`— a specific user's list slice
 *   - `*.detail(...)` — a single resource
 *   - `*.scope`       — a derived projection (marketplace, due cards, etc.)
 */

export const queryKeys = {
  decks: {
    all: ['decks'] as const,
    list: (userId: string) => ['decks', userId] as const,
    detail: (userId: string, deckId: string) => ['decks', userId, deckId] as const,
    marketplace: (filters?: Record<string, unknown>) =>
      ['decks', 'marketplace', filters ?? {}] as const,
  },
  cards: {
    all: ['cards'] as const,
    list: (userId: string) => ['cards', userId] as const,
    forDeck: (userId: string, deckId: string) => ['cards', userId, deckId] as const,
    due: (userId: string) => ['cards', userId, 'due'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string) => ['notifications', userId] as const,
    unreadCount: (userId: string) => ['notifications', userId, 'unread'] as const,
  },
  leaderboard: {
    all: ['leaderboard'] as const,
    weekly: (seasonId: string) => ['leaderboard', 'weekly', seasonId] as const,
    me: (userId: string) => ['leaderboard', 'me', userId] as const,
  },
  study: {
    stats: (userId: string) => ['study', 'stats', userId] as const,
    streak: (userId: string) => ['study', 'streak', userId] as const,
  },
} as const;
