import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, requireSupabase } from '../../services/database/supabase';
import { queryKeys } from '../../lib/queryKeys';

export interface LeaderboardRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  weekly_xp: number;
  accuracy_rate: number | null;
  tier: number;
}

/**
 * useLiveLeaderboard — weekly XP leaderboard with realtime updates.
 *
 * Subscribes to `league_memberships` table changes scoped to the given
 * season. On every INSERT/UPDATE we trigger a soft invalidate
 * (stale-time-limited refetch) so all visible rows stay within ~1
 * server round-trip of the source of truth.
 *
 * Profile fields (`full_name`, `avatar_url`) are joined via a SECOND
 * round-trip to `user_profiles` keyed by `user_id IN (...)` rather than
 * a PostgREST embedded-resources hint. We previously used
 * `user_profiles!inner(full_name,avatar_url)`, but that FK relationship
 * doesn't exist (league_memberships.user_id → auth.users.id, NOT
 * user_profiles.user_id), so PostgREST returned 400 "Could not find a
 * relationship ... in the schema cache". Mirrors the pattern in
 * ../useLiveLeaderboard.ts which already does it correctly.
 */
export function useLiveLeaderboard(seasonId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: seasonId
      ? queryKeys.leaderboard.weekly(seasonId)
      : ['leaderboard', 'weekly-anonymous'],
    enabled: !!seasonId,
    queryFn: async (): Promise<LeaderboardRow[]> => {
      if (!supabase || !seasonId) return [];

      // Round 1: league_memberships rows, ordered and limited.
      const { data: memberships, error: mErr } = await supabase
        .from('league_memberships')
        .select('user_id, weekly_xp, accuracy_rate, tier')
        .eq('season_id', seasonId)
        .order('weekly_xp', { ascending: false })
        .limit(50);
      if (mErr) throw mErr;
      const rows = (memberships ?? []) as Array<{
        user_id: string;
        weekly_xp: number;
        accuracy_rate: number | null;
        tier: number;
      }>;
      if (rows.length === 0) return [];

      // Round 2: user_profiles lookup keyed by user_id — `.in` builds a
      // safe parameterized list inside PostgREST.
      const userIds = rows.map((r) => r.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      if (pErr) throw pErr;
      const profileById = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      ((profiles ?? []) as Array<{ user_id: string; full_name: string | null; avatar_url: string | null }>).forEach((p) => {
        profileById.set(p.user_id, {
          full_name: p.full_name ?? null,
          avatar_url: p.avatar_url ?? null,
        });
      });

      // Round 3: client-side merge.
      return rows.map((row) => ({
        user_id: row.user_id,
        weekly_xp: row.weekly_xp,
        accuracy_rate: row.accuracy_rate,
        tier: row.tier,
        full_name: profileById.get(row.user_id)?.full_name ?? null,
        avatar_url: profileById.get(row.user_id)?.avatar_url ?? null,
      }));
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!supabase || !seasonId) return;
    // ISO-week labels (`2026-W30`) are server-rendered — not user input —
    // so direct interpolation into the realtime filter is safe.
    const channel = supabase
      .channel(`leaderboard-${seasonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_memberships',
          filter: `season_id=eq.${seasonId}`,
        },
        () => qc.invalidateQueries({ queryKey: queryKeys.leaderboard.weekly(seasonId) }),
      )
      .subscribe();
    return () => {
      requireSupabase().removeChannel(channel);
    };
  }, [seasonId, qc]);

  return query;
}
