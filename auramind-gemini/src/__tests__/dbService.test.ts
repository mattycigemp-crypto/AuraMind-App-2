import { describe, expect, it, beforeEach, vi } from 'vitest';
import { dbService } from '../services/database/dbService';
import { supabase } from '../services/database/supabase';

// Mock Supabase client
vi.mock('../services/database/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      }))
    }))
  }
}));

describe('dbService', () => {
  beforeEach(() => {
    // Clear cache before each test
    dbService.clearCache();
    vi.clearAllMocks();
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

      vi.mocked(supabase).from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDecks,
              error: null
            })
          })
        })
      });

      const result = await dbService.fetchDecks('user-123');
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Deck');
      expect(result[0].cardCount).toBe(10);
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

      vi.mocked(supabase).from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDeck,
              error: null
            })
          })
        })
      });

      const result = await dbService.createDeck('user-123', 'New Deck', 'New Description');
      
      expect(result.title).toBe('New Deck');
      expect(result.cardCount).toBe(0);
    });
  });

  describe('updateDeck', () => {
    it('should update deck properties', async () => {
      vi.mocked(supabase).from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      await expect(
        dbService.updateDeck('deck-1', { title: 'Updated Title' })
      ).resolves.not.toThrow();
    });
  });

  describe('deleteDeck', () => {
    it('should delete a deck', async () => {
      vi.mocked(supabase).from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      await expect(dbService.deleteDeck('deck-1')).resolves.not.toThrow();
    });
  });

  describe('fetchCards', () => {
    it('should fetch cards for a user', async () => {
      const mockCards = [
        {
          id: 'card-1',
          question: 'Test Question',
          answer: 'Test Answer',
          deck_id: 'deck-1',
          next_review: new Date().toISOString(),
          interval: 1,
          ease_factor: 2.5,
          repetition: 1,
          last_reviewed: new Date().toISOString()
        }
      ];

      vi.mocked(supabase).from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCards,
            error: null
          })
        })
      });

      const result = await dbService.fetchCards('user-123');
      
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Test Question');
    });
  });

  describe('saveCards', () => {
    it('should save multiple cards', async () => {
      const mockCards = [
        {
          id: 'card-1',
          question: 'Question 1',
          answer: 'Answer 1',
          deck_id: 'deck-1',
          next_review: new Date().toISOString(),
          interval: 0,
          ease_factor: 2.5,
          repetition: 0,
          last_reviewed: null
        }
      ];

      vi.mocked(supabase).from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockCards,
            error: null
          })
        })
      });

      const cardsToSave = [
        {
          deckId: 'deck-1',
          question: 'Question 1',
          answer: 'Answer 1',
          nextReview: Date.now(),
          interval: 0,
          easeFactor: 2.5,
          repetition: 0
        }
      ];

      const result = await dbService.saveCards('user-123', cardsToSave);
      
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Question 1');
    });
  });

  describe('updateCard', () => {
    it('should update card properties', async () => {
      vi.mocked(supabase).from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      await expect(
        dbService.updateCard('card-1', { question: 'Updated Question' })
      ).resolves.not.toThrow();
    });
  });

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      vi.mocked(supabase).from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      await expect(dbService.deleteCard('card-1')).resolves.not.toThrow();
    });
  });
});