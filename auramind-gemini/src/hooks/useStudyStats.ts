import { useCallback, useEffect, useState } from 'react';
import { sessionService } from '../services/database/modules/sessionService';
import type { StudySession } from '../types';

export interface UseStudyStatsReturn {
  /** Raw study sessions fetched from Supabase (newest first). */
  sessions: StudySession[];
  /** Sum of `cardsStudied` across sessions whose `startTime` is today's LOCAL date. */
  cardsReviewedToday: number;
  /** Consecutive local study days ending today (yesterday is allowed as the anchor). */
  streak: number;
  /** Sum of `cardsStudied` across ALL fetched sessions. */
  totalReviews: number;
  /** 0..1 accuracy across sessions started in the last 7 days, when any exist. */
  retention7d?: number;
  /** 0..100 accuracy of the most recent session (newest-first ordering). */
  lastSessionAccuracy?: number;
  loading: boolean;
  error: string | null;
  /** Re-run the fetch against Supabase. */
  refresh: () => Promise<void>;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Average accuracy (0..1) across sessions started in the last 7 days.
 * Handles both canonical columns (total_answers/correct_answers) and the
 * older 0..100 `accuracy` column, preferring exact counts when present.
 */
export function deriveRetention7d(sessions: StudySession[]): number | undefined {
  const cutoff = Date.now() - WEEK_MS;
  let answered = 0;
  let correct = 0;
  for (const s of sessions) {
    if ((s.startTime ?? 0) < cutoff) continue;
    const total = s.totalAnswers ?? s.cardsStudied ?? 0;
    if (total <= 0) continue;
    const ok =
      s.correctAnswers ??
      (s.accuracy != null ? Math.round((s.accuracy / 100) * total) : 0);
    answered += total;
    correct += ok;
  }
  return answered > 0 ? correct / answered : undefined;
}

/** Accuracy (0..100) of the most recent session. Sessions arrive newest-first. */
export function deriveLastSessionAccuracy(sessions: StudySession[]): number | undefined {
  return sessions[0]?.accuracy ?? undefined;
}

/**
 * Normalise a session `startTime` (epoch ms OR ISO string, as written by
 * `sessionService` / `StudyModePage`) into a local-calendar-date key so we can
 * compare "same day" regardless of the underlying representation.
 */
function toLocalDateKey(value: number | string | Date): string {
  return new Date(value).toDateString();
}

/**
 * Derive the current study streak from a set of sessions.
 *
 * A "study day" is any local calendar date that has at least one session. The
 * streak counts consecutive study days walking backwards from today. If the
 * user hasn't studied yet today but did yesterday, the streak is still kept
 * (anchored at yesterday) so it isn't broken until a full day is missed.
 * Returns 0 for empty input.
 */
function computeStreak(sessions: StudySession[]): number {
  const dateKeys = new Set<string>();
  for (const s of sessions) {
    if (s.startTime == null) continue;
    dateKeys.add(toLocalDateKey(s.startTime));
  }
  if (dateKeys.size === 0) return 0;

  const today = new Date();
  const todayKey = toLocalDateKey(today);

  const anchor = new Date(today);
  if (!dateKeys.has(todayKey)) {
    // No session today — allow yesterday as the streak anchor.
    anchor.setDate(anchor.getDate() - 1);
    if (!dateKeys.has(toLocalDateKey(anchor))) return 0;
  }

  let streak = 0;
  const cursor = new Date(anchor);
  while (dateKeys.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Read-only hook over the Supabase `study_sessions` table (the single source
 * of truth for study activity). Derives today's reviewed count, a streak, and
 * the lifetime total review count for a user.
 *
 * Pass `null`/`undefined` for `userId` to short-circuit (returns zeros,
 * `loading: false`, and never calls Supabase) — useful for logged-out states.
 */
export function useStudyStats(userId: string | null | undefined): UseStudyStatsReturn {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState<boolean>(() => Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.fetchStudySessions(userId);
      setSessions(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load study stats');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const todayKey = toLocalDateKey(new Date());
  const cardsReviewedToday = sessions
    .filter((s) => s.startTime != null && toLocalDateKey(s.startTime) === todayKey)
    .reduce((sum, s) => sum + (s.cardsStudied ?? 0), 0);

  const totalReviews = sessions.reduce((sum, s) => sum + (s.cardsStudied ?? 0), 0);

  const streak = computeStreak(sessions);

  return {
    sessions,
    cardsReviewedToday,
    streak,
    totalReviews,
    retention7d: deriveRetention7d(sessions),
    lastSessionAccuracy: deriveLastSessionAccuracy(sessions),
    loading,
    error,
    refresh,
  };
}
