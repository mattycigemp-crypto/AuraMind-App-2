import { supabase } from './supabase';
import { Card, Deck } from '../../types';
import { enrichCardsWithStoredMetadata } from '../study/roadmapService';

// Caching layer to avoid refecthing on navigation switch
let cachedDecks: Deck[] | null = null;
let cachedCards: Card[] | null = null;
let lastOwnerId: string | null = null;

export const dbService = {
    // --- CACHE MGMT ---
    clearCache() {
        cachedDecks = null;
        cachedCards = null;
        lastOwnerId = null;
    },

    // --- DECKS ---
    async fetchDecks(userId: string): Promise<Deck[]> {
        if (!supabase) {
            console.warn('Supabase not initialized, returning empty decks');
            return [];
        }
        
        if (cachedDecks && lastOwnerId === userId) {
            return cachedDecks;
        }

        const { data, error } = await supabase
            .from('decks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching decks:', error);
            throw error;
        }
        
        // Fetch cards to calculate card counts
        const { data: cardsData } = await supabase
            .from('cards')
            .select('deck_id')
            .in('deck_id', (data ?? []).map(d => d.id));
        
        const cardCounts = (cardsData ?? []).reduce((acc: any, card: any) => {
            acc[card.deck_id] = (acc[card.deck_id] || 0) + 1;
            return acc;
        }, {});
        
        const res = (data ?? []).map(d => ({
            id: d.id,
            title: d.title,
            description: d.description,
            createdAt: new Date(d.created_at).getTime(),
            cardCount: cardCounts[d.id] || 0
        }));

        cachedDecks = res;
        lastOwnerId = userId;
        return res;
    },

    async createDeck(userId: string, title: string, description: string): Promise<Deck> {
        const { data, error } = await supabase
            .from('decks')
            .insert([
                {
                    user_id: userId,
                    title,
                    description
                }
            ])
            .select()
            .single();

        if (error) throw error;
        const newDeck = {
            id: data.id,
            title: data.title,
            description: data.description,
            createdAt: new Date(data.created_at).getTime(),
            cardCount: 0
        };

        if (cachedDecks && lastOwnerId === userId) {
            cachedDecks = [newDeck, ...cachedDecks];
        }
        return newDeck;
    },

    async updateDeck(id: string, updates: Partial<Deck>): Promise<void> {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;

        const { error } = await supabase
            .from('decks')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;

        if (cachedDecks) {
            cachedDecks = cachedDecks.map(d => d.id === id ? { ...d, ...updates } : d);
        }
    },

    async deleteDeck(id: string): Promise<void> {
        const { error } = await supabase
            .from('decks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (cachedDecks) {
            cachedDecks = cachedDecks.filter(d => d.id !== id);
        }
        if (cachedCards) {
            cachedCards = cachedCards.filter(c => c.deckId !== id);
        }
    },

    // --- CARDS ---
    async fetchCards(userId: string): Promise<Card[]> {
        if (!supabase) {
            console.warn('Supabase not initialized, returning empty cards');
            return [];
        }

        if (cachedCards && lastOwnerId === userId) {
            return cachedCards;
        }

        // Fetch cards through decks relationship
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .in('deck_id', (await this.fetchDecks(userId)).map(d => d.id));

        if (error) {
            console.error('Error fetching cards:', error);
            throw error;
        }
        const res = enrichCardsWithStoredMetadata((data ?? []).map(c => ({
            id: c.id,
            question: c.question,
            answer: c.answer,
            deckId: c.deck_id,
            nextReview: new Date(c.next_review).getTime(),
            interval: c.interval,
            easeFactor: c.ease_factor,
            repetition: c.repetition,
            lastReviewed: c.last_reviewed ? new Date(c.last_reviewed).getTime() : undefined
        })));

        cachedCards = res;
        lastOwnerId = userId;
        return res;
    },

    async saveCards(userId: string, cards: Omit<Card, 'id'>[]): Promise<Card[]> {
        const dbCards = cards.map(c => ({
            question: c.question,
            answer: c.answer,
            deck_id: c.deckId,
            next_review: new Date(c.nextReview).toISOString(),
            interval: c.interval,
            ease_factor: c.easeFactor,
            repetition: c.repetition,
            last_reviewed: c.lastReviewed ? new Date(c.lastReviewed).toISOString() : null
        }));

        const { data, error } = await supabase
            .from('cards')
            .insert(dbCards)
            .select();

        if (error) throw error;
        const res = (data ?? []).map(c => ({
            id: c.id,
            question: c.question,
            answer: c.answer,
            deckId: c.deck_id,
            nextReview: new Date(c.next_review).getTime(),
            interval: c.interval,
            easeFactor: c.ease_factor,
            repetition: c.repetition,
            lastReviewed: c.last_reviewed ? new Date(c.last_reviewed).getTime() : undefined
        }));

        if (cachedCards && lastOwnerId === userId) {
            cachedCards = [...cachedCards, ...res];
        }

        return res;
    },

    async updateCard(id: string, updates: Partial<Card>): Promise<void> {
        const dbUpdates: any = {};
        if (updates.question !== undefined) dbUpdates.question = updates.question;
        if (updates.answer !== undefined) dbUpdates.answer = updates.answer;
        if (updates.nextReview !== undefined) dbUpdates.next_review = new Date(updates.nextReview).toISOString();
        if (updates.interval !== undefined) dbUpdates.interval = updates.interval;
        if (updates.easeFactor !== undefined) dbUpdates.ease_factor = updates.easeFactor;
        if (updates.repetition !== undefined) dbUpdates.repetition = updates.repetition;
        if (updates.lastReviewed !== undefined) dbUpdates.last_reviewed = new Date(updates.lastReviewed).toISOString();

        const { error } = await supabase
            .from('cards')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;

        if (cachedCards) {
            cachedCards = cachedCards.map(c => c.id === id ? { ...c, ...updates } : c);
        }
    },

    async deleteCard(id: string): Promise<void> {
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (cachedCards) {
            cachedCards = cachedCards.filter(c => c.id !== id);
        }
    }
};
