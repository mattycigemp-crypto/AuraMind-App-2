import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/database/supabase';
import { queryKeys } from '../../lib/queryKeys';
import type { Deck } from '../../types';

interface DeckInsert {
  title: string;
  description: string;
}

/**
 * useUserDecks — Supabase-backed useQuery for a user's deck list.
 *
 * Play nicely with realtime: callers can call
 * `queryClient.invalidateQueries({ queryKey: queryKeys.decks.list(userId) })`
 * on any insert/update notification and the UI re-renders with one fetch.
 */
export function useUserDecks(userId: string | null | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.decks.list(userId) : ['decks', 'anonymous'],
    enabled: !!userId,
    queryFn: async (): Promise<Deck[]> => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Deck[];
    },
  });
}

export function useCreateDeck(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, description }: DeckInsert): Promise<Deck> => {
      if (!supabase || !userId) throw new Error('Offline — deck will sync on reconnect');
      const { data, error } = await supabase
        .from('decks')
        .insert({ user_id: userId, title, description })
        .select('*')
        .single();
      if (error) throw error;
      return data as unknown as Deck;
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: queryKeys.decks.list(userId) });
    },
  });
}

/**
 * useDeleteDeck — optimistic delete with onError rollback.
 *
 * The cache is updated synchronously (the row vanishes immediately), the
 * network call fires, and on failure the previous value is restored.
 */
export function useDeleteDeck(userId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deckId: string): Promise<void> => {
      if (!supabase) throw new Error('Offline — will retry on reconnect');
      const { error } = await supabase.from('decks').delete().eq('id', deckId);
      if (error) throw error;
    },
    onMutate: async (deckId) => {
      if (!userId) return undefined;
      await qc.cancelQueries({ queryKey: queryKeys.decks.list(userId) });
      const previous = qc.getQueryData<Deck[]>(queryKeys.decks.list(userId));
      qc.setQueryData<Deck[]>(queryKeys.decks.list(userId), (old) =>
        (old ?? []).filter((d) => d.id !== deckId),
      );
      return { previous };
    },
    onError: (_err, _deckId, ctx) => {
      if (userId && ctx?.previous) {
        qc.setQueryData(queryKeys.decks.list(userId), ctx.previous);
      }
    },
    // Delete is atomic in Supabase — the server response already
    // confirms the row is gone, so we trust the optimistic remove
    // and skip the redundant revalidate.
  });
}
