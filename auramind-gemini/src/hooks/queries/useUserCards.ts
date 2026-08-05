import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/database/supabase';
import { queryKeys } from '../../lib/queryKeys';
import type { Card } from '../../types';

/**
 * useUserCards — Supabase-backed query for a user's full card list.
 *
 * For very large libraries (>2k cards) use `useUserDueCards` instead to
 * keep the network payload tight. This hook is mainly for the Decks
 * detail view where you want every card.
 */
export function useUserCards(userId: string | null | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.cards.list(userId) : ['cards', 'anonymous'],
    enabled: !!userId,
    queryFn: async (): Promise<Card[]> => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('next_review', { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as unknown as Card[];
    },
  });
}

/**
 * useUserDueCards — due-card projection used by Study Mode.
 *
 * `lte('next_review', todayIso)` returns cards whose `next_review` has
 * passed (or is null, which means "never reviewed, study first"). Capped
 * at 500 rows to keep the initial study session responsive; the Study
 * session itself paginates via the existing infinite-list pattern.
 */
export function useUserDueCards(userId: string | null | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.cards.due(userId) : ['cards', 'due-anonymous'],
    enabled: !!userId,
    queryFn: async () => {
      if (!supabase || !userId) return [];
      const todayIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review', todayIso)
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Card[];
    },
    staleTime: 30_000, // Due-card slice is more time-sensitive than decks
  });
}
