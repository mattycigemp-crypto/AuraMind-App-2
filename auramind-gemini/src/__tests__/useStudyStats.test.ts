// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStudyStats } from '../hooks/useStudyStats';
import type { StudySession } from '../types';

/**
 * Mock `sessionService` so the hook never touches Supabase. We control the
 * return value of `fetchStudySessions` per-test via `vi.mocked(...)`.
 */
vi.mock('../services/database/modules/sessionService', () => ({
  sessionService: {
    fetchStudySessions: vi.fn(),
  },
}));

// Imported after the mock so the binding resolves to the mock.
import { sessionService } from '../services/database/modules/sessionService';

/** Build a fully-typed StudySession, overriding only the fields under test. */
function makeSession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: 'session-1',
    userId: 'user-123',
    deckId: 'deck-1',
    startTime: Date.now(),
    endTime: Date.now(),
    cardsStudied: 5,
    correctAnswers: 4,
    totalAnswers: 5,
    accuracy: 0.8,
    duration: 60,
    ...overrides,
  };
}

describe('useStudyStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts a saved session dated today toward cardsReviewedToday', async () => {
    const today = makeSession({ id: 'today', cardsStudied: 5, startTime: Date.now() });
    vi.mocked(sessionService.fetchStudySessions).mockResolvedValue([today]);

    const { result } = renderHook(() => useStudyStats('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cardsReviewedToday).toBe(5);
    expect(result.current.totalReviews).toBe(5);
    expect(sessionService.fetchStudySessions).toHaveBeenCalledWith('user-123');
  });

  it('excludes a yesterday session from today but counts it in totalReviews', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySession = makeSession({
      id: 'yesterday',
      cardsStudied: 5,
      startTime: yesterday.getTime(),
    });
    vi.mocked(sessionService.fetchStudySessions).mockResolvedValue([yesterdaySession]);

    const { result } = renderHook(() => useStudyStats('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cardsReviewedToday).toBe(0);
    expect(result.current.totalReviews).toBe(5);
  });

  it('sums cardsStudied across multiple sessions for today', async () => {
    const sessions = [
      makeSession({ id: 'a', cardsStudied: 5, startTime: Date.now() }),
      makeSession({ id: 'b', cardsStudied: 7, startTime: Date.now() }),
    ];
    vi.mocked(sessionService.fetchStudySessions).mockResolvedValue(sessions);

    const { result } = renderHook(() => useStudyStats('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cardsReviewedToday).toBe(12);
    expect(result.current.totalReviews).toBe(12);
  });

  it('computes a streak from consecutive study days ending today', async () => {
    const today = new Date();
    const sessions: StudySession[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      sessions.push(makeSession({ id: `d${i}`, cardsStudied: 1, startTime: d.getTime() }));
    }
    vi.mocked(sessionService.fetchStudySessions).mockResolvedValue(sessions);

    const { result } = renderHook(() => useStudyStats('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.streak).toBe(3);
  });

  it('keeps a streak of 1 for a single session today', async () => {
    const today = makeSession({ id: 'today', cardsStudied: 5, startTime: Date.now() });
    vi.mocked(sessionService.fetchStudySessions).mockResolvedValue([today]);

    const { result } = renderHook(() => useStudyStats('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.streak).toBe(1);
  });

  it('returns 0 streak for empty sessions', async () => {
    vi.mocked(sessionService.fetchStudySessions).mockResolvedValue([]);

    const { result } = renderHook(() => useStudyStats('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.streak).toBe(0);
    expect(result.current.cardsReviewedToday).toBe(0);
    expect(result.current.totalReviews).toBe(0);
  });

  it('handles a missing userId gracefully without calling Supabase', async () => {
    const { result } = renderHook(() => useStudyStats(null));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cardsReviewedToday).toBe(0);
    expect(result.current.totalReviews).toBe(0);
    expect(result.current.streak).toBe(0);
    expect(sessionService.fetchStudySessions).not.toHaveBeenCalled();
  });

  it('surfaces fetch errors without throwing', async () => {
    vi.mocked(sessionService.fetchStudySessions).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useStudyStats('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('boom');
    expect(result.current.cardsReviewedToday).toBe(0);
    expect(result.current.totalReviews).toBe(0);
  });

  it('exposes refresh() that re-runs the fetch', async () => {
    vi.mocked(sessionService.fetchStudySessions).mockResolvedValue([]);

    const { result } = renderHook(() => useStudyStats('user-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(sessionService.fetchStudySessions).toHaveBeenCalledTimes(1);

    await result.current.refresh();

    expect(sessionService.fetchStudySessions).toHaveBeenCalledTimes(2);
  });

  it('also counts a session stored as an ISO string for today', async () => {
    // start_time may come back from Supabase as an ISO string; the hook must
    // still recognise it as "today" via new Date(...).
    const isoToday = makeSession({
      id: 'iso-today',
      cardsStudied: 5,
      startTime: new Date().toISOString() as unknown as number,
    });
    vi.mocked(sessionService.fetchStudySessions).mockResolvedValue([isoToday]);

    const { result } = renderHook(() => useStudyStats('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cardsReviewedToday).toBe(5);
    expect(result.current.totalReviews).toBe(5);
  });
});
