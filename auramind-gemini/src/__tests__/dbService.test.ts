import { describe, expect, it, beforeEach, vi } from 'vitest';
import { dbService } from '../services/database/dbService';
import { supabase } from '../services/database/supabase';
import { ensureUserSynced } from '../services/database/syncUser';

// Mock Supabase client
vi.mock('../services/database/supabase', () => {
  const createChainableMock = () => {
    const mock = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(), // Will be resolved
      select: vi.fn(), // Will return a chainable mock
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      mockResolvedValue: vi.fn(), // Default for terminal operations
    };

    mock.select.mockImplementation(() => createChainableMock()); // Select returns a new chainable mock
    mock.insert.mockImplementation(() => ({
      select: vi.fn(() => createChainableMock()),
      mockResolvedValue: vi.fn(),
    }));
    mock.update.mockImplementation(() => ({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn(() => createChainableMock()),
      mockResolvedValue: vi.fn(),
    }));
    mock.delete.mockImplementation(() => ({
      eq: vi.fn().mockReturnThis(),
      mockResolvedValue: vi.fn(),
    }));

    // Default resolved value for single()
    mock.single.mockResolvedValue({ data: null, error: null });
    // Default resolved value for general queries (e.g., select without single)
    mock.mockResolvedValue.mockResolvedValue({ data: [], error: null });

    return mock;
  };

  return {
    supabase: {
      from: vi.fn(() => createChainableMock()),
      auth: {
        getUser: vi.fn(() => ({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null })),
      },
    },
  };
});

// Mock syncUser module
vi.mock('../services/database/syncUser', () => ({
  ensureUserSynced: vi.fn(() => Promise.resolve(true)),
}));

describe('dbService', () => {
  beforeEach(() => {
    // Clear cache before each test
    dbService.clearCache();
    vi.clearAllMocks();
    // Reset Supabase mock for each test
    vi.mocked(supabase.from).mockClear();
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      dbService.clearCache();
      // Cache clearing is internal, but we can verify it doesn't throw
      expect(() => dbService.clearCache()).not.toThrow();
    });
  });

  describe('fetchDecks', () => {
    it('should fetch decks for a user', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          title: 'Test Deck',
          description: 'Test Description',
          card_count: 10,
          created_at: new Date().toISOString()
        }
      ];

      const mockCards = [
        {
          deck_id: 'deck-1'
        }
      ];

      // Mock for fetching decks
      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockDecks, error: null }),
      })) as any);

      // Mock for fetching cards to calculate card counts
      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValueOnce({ data: mockCards, error: null }),
      })) as any);

      const result = await dbService.fetchDecks('user-123');
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Deck');
      expect(result[0].cardCount).toBe(1);
    });
  });

  describe('createDeck', () => {
    it('should create a new deck', async () => {
      const mockDeck = {
        id: 'new-deck',
        title: 'New Deck',
        description: 'New Description',
        card_count: 0,
        created_at: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn(() => ({
            single: vi.fn().mockResolvedValueOnce({ data: mockDeck, error: null }),
        })),
      })) as any);

      const result = await dbService.createDeck('user-123', 'New Deck', 'New Description');
      
      expect(result.title).toBe('New Deck');
      expect(result.cardCount).toBe(0);
    });
  });

  describe('updateDeck', () => {
    it('should update deck properties', async () => {
      const updatedDeck = {
        id: 'deck-1',
        title: 'Updated Title',
        description: 'Test Description',
        card_count: 10,
        created_at: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn(() => ({
            single: vi.fn().mockResolvedValueOnce({ data: updatedDeck, error: null }),
        })),
      })) as any);

      await expect(
        dbService.updateDeck('deck-1', { title: 'Updated Title' })
        // Internally maps to { name: 'Updated Title' } for Supabase
      ).resolves.not.toThrow();
    });
  });

  describe('deleteDeck', () => {
    it('should delete a deck', async () => {
      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      })) as any);

      await expect(dbService.deleteDeck('deck-1')).resolves.not.toThrow();
    });
  });

  describe('fetchCards', () => {
    it('should fetch cards for a user', async () => {
      const mockCards = [
        {
          id: 'card-1',
          front: 'Test Question',
          back: 'Test Answer',
          deck_id: 'deck-1',
          next_review: new Date().toISOString(),
          interval: 1,
          ease_factor: 2.5,
          repetition: 1,
          last_reviewed: new Date().toISOString(),
          understanding_level: 1,
          source_type: 'manual',
          source_label: 'test',
          citations: [],
          trust_score: 1
        }
      ];

      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockCards, error: null }),
      })) as any);

      const result = await dbService.fetchCards('user-123');
      
      expect(result).toHaveLength(1);
      expect(result[0].front).toBe('Test Question');
    });
  });

  describe('saveCards', () => {
    it('should save multiple cards', async () => {
      const mockCards = [
        {
          id: 'card-1',
          front: 'Question 1',
          back: 'Answer 1',
          deck_id: 'deck-1',
          next_review: new Date().toISOString(),
          interval: 0,
          ease_factor: 2.5,
          repetition: 0,
          last_reviewed: null,
          understanding_level: 0,
          source_type: 'manual',
          source_label: 'test',
          citations: [],
          trust_score: 1
        }
      ];

      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValueOnce({ data: mockCards, error: null }),
      })) as any);

      const cardsToSave = [
        {
          deckId: 'deck-1',
          front: 'Question 1',
          back: 'Answer 1',
          nextReview: Date.now(),
          interval: 0,
          easeFactor: 2.5,
          repetition: 0
        }
      ];

      const result = await dbService.saveCards('user-123', cardsToSave);
      
      expect(result).toHaveLength(1);
      expect(result[0].front).toBe('Question 1');
    });
  });

  describe('updateCard', () => {
    it('should update card properties', async () => {
      const updatedCard = {
        id: 'card-1',
        front: 'Updated Question',
        back: 'Test Answer',
        deck_id: 'deck-1',
        next_review: new Date().toISOString(),
        interval: 1,
        ease_factor: 2.5,
        repetition: 1,
        last_reviewed: new Date().toISOString(),
        understanding_level: 1,
        source_type: 'manual',
        source_label: 'test',
        citations: [],
        trust_score: 1
      };

      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn(() => ({
            single: vi.fn().mockResolvedValueOnce({ data: updatedCard, error: null }),
        })),
      })) as any);

      await expect(
        dbService.updateCard('card-1', { front: 'Updated Question' as any })
      ).resolves.not.toThrow();
    });
  });

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      })) as any);

      await expect(dbService.deleteCard('card-1')).resolves.not.toThrow();
    });
  });

  describe('saveStudySession', () => {
    it('should save a study session', async () => {
      const mockSession = {
        id: 'session-1',
        user_id: 'user-123',
        deck_id: 'deck-1',
        start_time: Date.now(),
        end_time: Date.now() + 60000,
        cards_studied: 10,
        correct_answers: 8,
        total_answers: 10,
        accuracy: 0.8,
        duration: 60,
      };

      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValueOnce({ data: mockSession, error: null }),
        })),
      })) as any);

      const sessionToSave = {
        userId: 'user-123',
        deckId: 'deck-1',
        startTime: Date.now(),
        endTime: Date.now() + 60000,
        cardsStudied: 10,
        correctAnswers: 8,
        totalAnswers: 10,
        accuracy: 0.8,
        duration: 60,
      };

      const result = await dbService.saveStudySession(sessionToSave);

      expect(result.userId).toBe('user-123');
      expect(result.cardsStudied).toBe(10);
    });
  });

  describe('fetchStudySessions', () => {
    it('should fetch study sessions for a user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-123',
          deck_id: 'deck-1',
          start_time: Date.now(),
          end_time: Date.now() + 60000,
          cards_studied: 10,
          correct_answers: 8,
          total_answers: 10,
          accuracy: 0.8,
          duration: 60,
        },
      ];

      vi.mocked(supabase.from).mockImplementationOnce((() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: mockSessions, error: null }),
      })) as any);

      const result = await dbService.fetchStudySessions('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-123');
    });
  });
});


