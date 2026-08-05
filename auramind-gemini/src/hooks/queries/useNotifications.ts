import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../services/database/supabase';
import { queryKeys } from '../../lib/queryKeys';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'warning' | 'error';
  action_url?: string | null;
  action_label?: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * useNotifications — paginated Supabase-backed notifications list.
 *
 * Auto-refreshes via the realtime channel: when a row INSERTs/UPDATEs,
 * we invalidate the user-scoped key and the next render fetches fresh.
 *
 * The channel subscription is the ONLY side-effect inside the hook —
 * cleanup tears it down on unmount or userId change so we never leak.
 */
export function useNotifications(userId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: userId ? queryKeys.notifications.list(userId) : ['notifications', 'anonymous'],
    enabled: !!userId,
    queryFn: async (): Promise<NotificationRow[]> => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as NotificationRow[];
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!supabase || !userId) return;
    // `userId` is the authenticated UUID from supabase.auth.getUser(), a
    // server-rendered value — not user-input — so direct interpolation
    // into the realtime `filter` string is safe (no injection surface).
    const channel = supabase
      .channel(`auramind-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => qc.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return query;
}

/**
 * useUnreadNotificationsCount — derived count query for the bell badge.
 * Lives in its own query key so toggling read state doesn't refetch the
 * whole list.
 */
export function useUnreadNotificationsCount(userId: string | null | undefined) {
  return useQuery({
    queryKey: userId
      ? queryKeys.notifications.unreadCount(userId)
      : ['notifications', 'unread-anonymous'],
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      if (!supabase || !userId) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 15_000,
  });
}
