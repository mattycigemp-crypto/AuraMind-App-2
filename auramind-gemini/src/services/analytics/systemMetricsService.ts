import { supabase } from '../database/supabase';

/**
 * System metrics — every number here is a live aggregate over the real
 * database tables (user_profiles, cards, decks, study_sessions,
 * card_reviews). No simulated values.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function emptyMetrics() {
  return {
    totalUsers: 0,
    activeUsers7d: 0,
    totalCards: 0,
    totalDecks: 0,
    totalStudySessions: 0,
    totalReviews: 0,
  };
}

export const systemMetricsService = {
  async getSystemMetrics() {
    if (!supabase) return emptyMetrics();

    const todayStart = new Date(Date.now() - 7 * DAY_MS).toISOString();

    const [users, cards, decks, sessions, reviews, active] = await Promise.all([
      supabase.from('user_profiles').select('id'),
      supabase.from('cards').select('id'),
      supabase.from('decks').select('id'),
      supabase.from('study_sessions').select('id'),
      supabase.from('card_reviews').select('id'),
      supabase
        .from('study_sessions')
        .select('user_id')
        .gte('started_at', todayStart),
    ]);

    const activeUserIds = new Set<string>();
    (active.data ?? [] as Array<{ user_id: string | null }>).forEach((row) => {
      if (row.user_id) activeUserIds.add(row.user_id);
    });

    return {
      totalUsers: users.data?.length || 0,
      activeUsers7d: activeUserIds.size,
      totalCards: cards.data?.length || 0,
      totalDecks: decks.data?.length || 0,
      totalStudySessions: sessions.data?.length || 0,
      totalReviews: reviews.data?.length || 0,
    };
  },

  async getUserActivity(userId: string) {
    if (!supabase || !userId) {
      return {
        studyTimeMs: 0,
        cardsReviewed: 0,
        accuracy: 0,
        streak: 0,
      };
    }

    const [sessions, reviews, profile] = await Promise.all([
      supabase
        .from('study_sessions')
        .select('duration_ms, accuracy')
        .eq('user_id', userId),
      supabase
        .from('card_reviews')
        .select('id')
        .eq('user_id', userId),
      supabase
        .from('user_profiles')
        .select('streak_days')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const sessionRows = (sessions.data ?? []) as Array<{ duration_ms: number | null; accuracy: number | null }>;
    const studyTimeMs = sessionRows.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0);
    const accuracyRows = sessionRows.filter((s) => typeof s.accuracy === 'number');
    const accuracy = accuracyRows.length > 0
      ? Math.round(accuracyRows.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / accuracyRows.length)
      : 0;

    return {
      studyTimeMs,
      cardsReviewed: reviews.data?.length || 0,
      accuracy,
      streak: (profile.data as { streak_days?: number } | null)?.streak_days ?? 0,
    };
  },
};
