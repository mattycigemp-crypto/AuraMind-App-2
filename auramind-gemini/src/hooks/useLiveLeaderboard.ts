import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, requireSupabase } from '../services/database/supabase';
import type { LeagueMemberView } from '../types/league';

/**
 * useLiveLeaderboard — subscribes to Supabase Postgres Changes on
 * `league_memberships` for the current season, keeping the leaderboard
 * UI in sync without manual refreshes.
 *
 * Usage:
 *   const { members, loading, error } = useLiveLeaderboard(seasonId, tier);
 *
 * The hook also exposes `optimisticUpdate()` for instant local XP bumps
 * before the DB round-trip completes.
 */

export interface LiveLeaderboardState {
  members: LeagueMemberView[];
  loading: boolean;
  error: string | null;
  lastUpdate: number;
}

export function useLiveLeaderboard(
  seasonId: string | undefined,
  tier: number | undefined,
  currentUserId?: string,
) {
  const [state, setState] = useState<LiveLeaderboardState>({
    members: [],
    loading: true,
    error: null,
    lastUpdate: 0,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Stabilize currentUserId via ref so fetchMembers doesn't recreate
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  // Fetch initial data
  const fetchMembers = useCallback(async () => {
    if (!supabase || !seasonId || tier === undefined) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data: rows, error } = await supabase
        .from('league_memberships')
        .select('user_id, weekly_xp, accuracy_rate, league_group_id')
        .eq('season_id', seasonId)
        .eq('tier', tier);

      if (error) throw error;

      // Fetch user profiles for names
      const userIds = (rows ?? []).map((r: any) => r.user_id);
      const { data: profiles } = userIds.length > 0
        ? await supabase
            .from('user_profiles')          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds)
        : { data: [] };

      const nameMap = new Map<string, string>();
      const avatarMap = new Map<string, string>();
      (profiles ?? []).forEach((p: any) => {
        nameMap.set(p.user_id, p.full_name || p.email?.split('@')[0] || 'Learner');
        if (p.avatar_url) avatarMap.set(p.user_id, p.avatar_url);
      });

      const uid = currentUserIdRef.current;
      const members: LeagueMemberView[] = (rows ?? [])
        .map((r: any) => ({
          userId: r.user_id,
          name: nameMap.get(r.user_id) ?? 'Learner',
          avatar: avatarMap.get(r.user_id),
          weeklyXp: r.weekly_xp ?? 0,
          accuracyRate: Number(r.accuracy_rate ?? 0),
          rank: 0,
          tier,
          trend: 'same' as const,
          isCurrentUser: r.user_id === uid,
        }))
        .sort((a, b) => b.weeklyXp - a.weeklyXp || b.accuracyRate - a.accuracyRate)
        .map((m, i) => ({ ...m, rank: i + 1 }));

      setState({
        members,
        loading: false,
        error: null,
        lastUpdate: Date.now(),
      });
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: e.message ?? 'Failed to load leaderboard',
      }));
    }
  }, [seasonId, tier]);

  // Initial fetch
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Subscribe to Postgres Changes
  useEffect(() => {
    if (!supabase || !seasonId || tier === undefined) return;

    const channel = supabase
      .channel(`leaderboard:${seasonId}:tier${tier}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'league_memberships',
          filter: `season_id=eq.${seasonId}`,
        },
        (_payload) => {
          // Re-fetch on any change (simplest correct approach;
          // a production build could diff the payload for speed)
          fetchMembers();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current && supabase) {
        requireSupabase().removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [seasonId, tier, fetchMembers]);

  /** Optimistic local XP bump — call before the DB write for instant UI feedback. */
  const optimisticUpdate = useCallback((userId: string, xpDelta: number) => {
    setState(prev => ({
      ...prev,
      members: prev.members
        .map((m) =>
          m.userId === userId
            ? { ...m, weeklyXp: m.weeklyXp + xpDelta, trend: 'up' as const }
            : m,
        )
        .sort((a, b) => b.weeklyXp - a.weeklyXp || b.accuracyRate - a.accuracyRate)
        .map((m, i) => ({ ...m, rank: i + 1 })),
      lastUpdate: Date.now(),
    }));
  }, []);

  return {
    ...state,
    refresh: fetchMembers,
    optimisticUpdate,
  };
}
