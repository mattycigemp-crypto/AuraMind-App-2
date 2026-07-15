import { supabase } from '../supabase';
import { Card } from '../../../types';
import { ensureUserSynced } from '../syncUser';
import { cachedCards, lastOwnerId, setCachedCards, setLastOwnerId } from './cache';

export const cardService = {
    async fetchCards(userId: string): Promise<Card[]> {
        if (!supabase) {
            console.warn('Supabase not initialized, returning empty cards');
            return [];
        }
        
        await ensureUserSynced();
        
        if (cachedCards && lastOwnerId === userId) {
            return cachedCards;
        }

        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('user_id', userId)
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching cards:', error);
            return [];
        }

        const res = (data ?? []).map(c => ({
            id: c.id,
            front: c.front,
            back: c.back,
            deckId: c.deck_id,
            image: c.image,
            nextReview: c.next_review || Date.now(),
            interval: c.interval || 0,
            easeFactor: c.ease_factor || 2.5,
            repetition: c.repetition || 0,
            understandingLevel: c.understanding_level,
            lastReviewed: c.last_reviewed,
            sourceType: c.source_type,
            sourceLabel: c.source_label,
            citations: c.citations,
            trustScore: c.trust_score,
            verified: c.verified,
            fsrsState: c.fsrs_state ? (typeof c.fsrs_state === 'string' ? JSON.parse(c.fsrs_state) : c.fsrs_state) : undefined
        }));

        setCachedCards(res);
        setLastOwnerId(userId);
        return res;
    },

    async saveCards(userId: string, cards: Partial<Card>[]): Promise<Card[]> {
        if (!supabase) throw new Error('Supabase not initialized');
        
        await ensureUserSynced();
        
        const cardsToInsert = cards.map(card => {
            const row: Record<string, any> = {
                user_id: userId,
                deck_id: card.deckId,
                front: (card as any).front || (card as any).question,
                back: (card as any).back || (card as any).answer,
            };
            if ((card as any).header != null) row.header = (card as any).header;
            if (card.image != null) row.image = card.image;
            if (card.sourceType != null) row.source_type = card.sourceType;
            if (card.sourceLabel != null) row.source_label = card.sourceLabel;
            if (card.citations != null) row.citations = card.citations;
            if (card.trustScore != null) row.trust_score = card.trustScore;
            if (card.verified != null) row.verified = card.verified;
            if (card.fsrsState != null) row.fsrs_state = JSON.stringify(card.fsrsState);
            return row;
        });

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const res = await fetch(`${supabaseUrl}/rest/v1/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken || supabaseAnonKey}`,
                'Prefer': 'return=representation',
            },
            body: JSON.stringify(cardsToInsert),
        });

        if (!res.ok) {
            const errBody = await res.json();
            throw errBody;
        }

        const data = await res.json();
        const savedCards = data.map((c: any) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            header: c.header,
            deckId: c.deck_id,
            image: c.image,
            nextReview: c.next_review || Date.now(),
            interval: c.interval || 0,
            easeFactor: c.ease_factor || 2.5,
            repetition: c.repetition || 0,
            understandingLevel: c.understanding_level,
            lastReviewed: c.last_reviewed,
            sourceType: c.source_type,
            sourceLabel: c.source_label,
            citations: c.citations,
            trustScore: c.trust_score,
            verified: c.verified,
            fsrsState: c.fsrs_state ? (typeof c.fsrs_state === 'string' ? JSON.parse(c.fsrs_state) : c.fsrs_state) : undefined
        }));

        if (cachedCards) {
            setCachedCards([...savedCards, ...cachedCards]);
        }

        return savedCards;
    },

    async updateCard(id: string, updates: Partial<Card>): Promise<Card> {
        if (!supabase) throw new Error('Supabase not initialized');

        const updatesForDb: Record<string, any> = {};
        if (updates.deckId !== undefined) updatesForDb.deck_id = updates.deckId;
        if ((updates as any).front !== undefined) updatesForDb.front = (updates as any).front;
        else if ((updates as any).question !== undefined) updatesForDb.front = (updates as any).question;
        if ((updates as any).back !== undefined) updatesForDb.back = (updates as any).back;
        else if ((updates as any).answer !== undefined) updatesForDb.back = (updates as any).answer;
        if (updates.sourceType !== undefined) updatesForDb.source_type = updates.sourceType;
        if (updates.sourceLabel !== undefined) updatesForDb.source_label = updates.sourceLabel;
        if (updates.citations !== undefined) updatesForDb.citations = updates.citations;
        if (updates.trustScore !== undefined) updatesForDb.trust_score = updates.trustScore;
        if (updates.verified !== undefined) updatesForDb.verified = updates.verified;
        if (updates.fsrsState !== undefined) updatesForDb.fsrs_state = JSON.stringify(updates.fsrsState);

        // Optimistically update local cache first so the UI never waits on the network
        const existingCard = cachedCards?.find(card => card.id === id);
        const optimisticCard: Card | undefined = existingCard
            ? { ...existingCard, ...updates, id }
            : undefined;

        if (optimisticCard && cachedCards) {
            setCachedCards(cachedCards.map(card =>
                card.id === id ? optimisticCard : card
            ));
        }

        // Use .select() without .single() so a missing RLS UPDATE policy (0 rows)
        // does not crash the app with PGRST116.
        const { data, error } = await supabase
            .from('cards')
            .update(updatesForDb)
            .eq('id', id)
            .select();

        if (error) {
            // Don't block the study session; keep the optimistic update in cache.
            console.warn('Supabase updateCard failed (keeping optimistic update):', error);
            if (!optimisticCard) throw error;
            return optimisticCard;
        }

        const row = data && data.length > 0 ? data[0] : null;
        if (!row) {
            // 0 rows returned: either missing UPDATE RLS policy, auth UID mismatch,
            // or the request is unauthenticated. Keep optimistic update.
            const { data: { session } } = await supabase.auth.getSession();
            console.warn('Supabase updateCard returned 0 rows. Possible causes: missing UPDATE RLS policy, unauthenticated request, or auth UID mismatch.', {
                cardId: id,
                authUid: session?.user?.id ?? null,
                hasAuthToken: !!session?.access_token,
            });
            if (!optimisticCard) throw new Error(`Card ${id} not found or not updatable`);
            return optimisticCard;
        }

        const updatedCard: Card = {
            id: row.id,
            front: row.front,
            back: row.back,
            deckId: row.deck_id,
            image: row.image,
            nextReview: row.next_review || Date.now(),
            interval: row.interval || 0,
            easeFactor: row.ease_factor || 2.5,
            repetition: row.repetition || 0,
            understandingLevel: row.understanding_level,
            lastReviewed: row.last_reviewed,
            sourceType: row.source_type,
            sourceLabel: row.source_label,
            citations: row.citations,
            trustScore: row.trust_score,
            verified: row.verified,
            fsrsState: row.fsrs_state ? (typeof row.fsrs_state === 'string' ? JSON.parse(row.fsrs_state) : row.fsrs_state) : undefined
        };

        if (cachedCards) {
            setCachedCards(cachedCards.map(card => 
                card.id === id ? updatedCard : card
            ));
        }

        return updatedCard;
    },

    async deleteCard(id: string): Promise<void> {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (cachedCards) {
            setCachedCards(cachedCards.filter(card => card.id !== id));
        }
    }
};



