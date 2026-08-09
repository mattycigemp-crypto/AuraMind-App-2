-- AuraMind Database Migration: League weekly_xp atomic increment RPC
-- Date: 2026-07-20
-- Version: 3.7.1
--
-- The pre-existing `league_memberships` table (`20260719_league_tables.sql`) has a
-- `UNIQUE (season_id, user_id)` constraint and a foreign key to `league_seasons`
-- (`season_id TEXT NOT NULL REFERENCES public.league_seasons(id)`). The original
-- TypeScript upsert in `leagueService.ts` had two compounding bugs that surfaced
-- in the dev preview as `POST league_memberships 409 (Conflict)`:
--
--   A. The upsert payload set `weekly_xp: xpDelta` (replacing the running total
--      instead of incrementing it) — even on a "successful" upsert this silently
--      regressed the user's standing to just the latest session's reward.
--
--   B. `maybeEnsureSeasonExists()` was called *after* the upsert, but the FK
--      constraint demands the season row exist before any membership row that
--      references it. For a brand-new user in week 2026-W30 (or whenever the
--      server's clock first answers `currentSeasonId()`), `league_seasons` was
--      empty — every INSERT half of the upsert failed FK 23503 → upsert mapped
--      to 409 by PostgREST.
--
-- This migration defines a single SECURITY DEFINER RPC that:
--
--   1. Auto-inserts `league_seasons` row if missing (uses currentSeasonId()
--      convention — week-label id, ends_at 7 days after starts_at).
--   2. Atomically upserts `league_memberships` with `weekly_xp = weekly_xp + delta`
--      so the running total is preserved across multiple concurrent study
--      sessions (no race-window where two tabs clobber each other).
--   3. Updates `accuracy_rate` as an exponential moving average anchored at 0.7
--      (the prior accuracy gets 70% weight; the new sample 30%) — a sensible
--      default that doesn't drown out the first few sessions.
--   4. Returns the new `weekly_xp`, `accuracy_rate`, `group_id`, `tier` so the
--      caller can immediately render rank/leaderboard without a second query.
--
-- The RPC is the single source of truth for awardWeeklyXp semantics — the
-- TypeScript leagueService.ts gets rewritten to call this RPC and the
-- separate upsert + ensureSeason path is deleted.
--
-- RLS unchanged: the RPC runs as SECURITY DEFINER but the body still anchors
-- the WHERE on `auth.uid() = p_user_id` so a misbehaving client cannot
-- increment someone else's standing.

CREATE OR REPLACE FUNCTION public.increment_weekly_xp(
  p_user_id      UUID,
  p_group_id     TEXT,
  p_tier         INT,
  p_xp_delta     INT,
  p_accuracy     NUMERIC
) RETURNS TABLE (
  weekly_xp      INT,
  accuracy_rate  REAL,
  group_id       TEXT,
  tier           INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id     TEXT;
  v_starts_at     TIMESTAMPTZ;
  v_ends_at       TIMESTAMPTZ;
  v_prev_xp       INT;
  v_prev_acc      REAL;
  v_new_xp        INT;
  v_new_acc       REAL;
BEGIN
  -- Defensive: only ever credit the calling user's own row.
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'cannot increment weekly XP for another user'
      USING ERRCODE = '42501';
  END IF;

  IF p_xp_delta IS NULL OR p_xp_delta < 0 THEN
    RAISE EXCEPTION 'xp_delta must be >= 0' USING ERRCODE = '22023';
  END IF;

  IF p_tier IS NULL OR p_tier < 1 OR p_tier > 10 THEN
    RAISE EXCEPTION 'tier must be in [1, 10]' USING ERRCODE = '22023';
  END IF;

  -- Mirror the currentSeasonId() convention used in src/types/league.ts:
  -- the season id is the ISO week label (e.g. '2026-W30'), Mon-anchored.
  v_season_id := to_char(NOW() AT TIME ZONE 'UTC', 'IYYY-"W"IW');

  -- Week starts Mon 00:00 UTC, ends Sun 23:59:59 UTC. We write absolute
  -- timestamps so the LeaguesPage countdown can show "ends in 3d 4h".
  v_starts_at := date_trunc('week', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_ends_at   := v_starts_at + INTERVAL '7 days';

  -- Auto-create the season row if missing. INSERT … ON CONFLICT DO NOTHING
  -- is safe on existing seasons. We don't need to worry about RLS here
  -- because the season row is a public-readable lookup, not a per-user row.
  INSERT INTO public.league_seasons (id, starts_at, ends_at)
  VALUES (v_season_id, v_starts_at, v_ends_at)
  ON CONFLICT (id) DO NOTHING;

  -- Read previous values for the running-total + accuracy EMA maths.
  -- COALESCE handles the new-row case (first session of the week).
  SELECT
    COALESCE(weekly_xp, 0),
    COALESCE(accuracy_rate, 0)
  INTO v_prev_xp, v_prev_acc
  FROM public.league_memberships
  WHERE season_id = v_season_id
    AND user_id   = p_user_id;

  IF NOT FOUND THEN
    v_prev_xp  := 0;
    v_prev_acc := 0;
  END IF;

  -- Atomic running-total: never regress weekly_xp, never saturate below 0.
  v_new_xp := GREATEST(0, v_prev_xp + p_xp_delta);

  -- Accuracy EMA: prior accuracy gets 70% weight, new sample 30%. The EMA is
  -- the simplest "smooth without drowning out new data" approach for a
  -- single-number per-week metric; a future PR can swap to a more sophisticated
  -- bayesian average if the rate samples are dense enough to warrant.
  v_new_acc := CASE
    WHEN p_accuracy IS NULL THEN v_prev_acc
    WHEN v_prev_acc = 0     THEN GREATEST(0, LEAST(100, p_accuracy))
    ELSE (0.7 * v_prev_acc + 0.3 * p_accuracy)::REAL
  END;
  v_new_acc := GREATEST(0, LEAST(100, v_new_acc))::REAL;

  -- Single upsert — preserves weekly_xp across multiple callers (no race
  -- window because it's a single statement at READ COMMITTED isolation).
  INSERT INTO public.league_memberships (
    season_id, user_id, league_group_id, tier, weekly_xp, accuracy_rate
  )
  VALUES (
    v_season_id, p_user_id, p_group_id, p_tier, v_new_xp, v_new_acc
  )
  ON CONFLICT (season_id, user_id) DO UPDATE
    SET weekly_xp     = GREATEST(0, public.league_memberships.weekly_xp + EXCLUDED.weekly_xp),
        accuracy_rate = v_new_acc,
        league_group_id = EXCLUDED.league_group_id,
        tier          = EXCLUDED.tier,
        updated_at    = NOW();

  RETURN QUERY
  SELECT v_new_xp, v_new_acc, p_group_id, p_tier;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_weekly_xp(UUID, TEXT, INT, INT, NUMERIC) TO authenticated;

-- Bookkeeping per project convention.
INSERT INTO schema_migrations (version, description)
VALUES ('20260720_league_weekly_xp_rpc',
        'Atomic SECURITY DEFINER RPC increment_weekly_xp — atomic upsert + auto-create season, no race window')
ON CONFLICT (version) DO NOTHING;

-- Migration complete.
-- To verify:
--   SELECT weekly_xp, accuracy_rate FROM league_memberships
--    WHERE user_id = auth.uid() ORDER BY updated_at DESC LIMIT 1;
--   SELECT prosrc FROM pg_proc WHERE proname = 'increment_weekly_xp';
