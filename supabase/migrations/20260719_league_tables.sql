-- supabase/migrations/20260719_league_tables.sql
--
-- Adds the League subsystem tables that `src/services/gamification/leagueService.ts`
-- reads from and writes to. Without these, every dashboard mount produces a
-- `GET /rest/v1/league_memberships 404` from the Leagues panel helper.
--
-- Tables:
--   league_seasons       — one row per ISO week, e.g. id='2026-W30'. Public-readable.
--   league_memberships   — one row per (user, season). Unique (season_id, user_id)
--                          so the same user can repeatedly upsert weekly_xp without
--                          overwriting peers. RLS lets every authenticated user
--                          READ any membership (guild-style leaderboard) but only
--                          INSERT/UPDATE their own row.
--
-- Index notes:
--   (season_id, tier) covering index — every leaderboard query filters both.
--   (user_id) index   — fast "where am I in the standings" lookup.
--   league_seasons.starts_at desc — LeaguesPage's live countdown re-reads the
--                                   ends_at-min(starts_at) once per minute.
--
-- Trigger:
--   updated_at refreshes on every UPDATE so the client can compute "last seen
--   alive" without a separate heartbeat column.

-- 1) League seasons (IF NOT EXISTS — may already exist from 20260715).
CREATE TABLE IF NOT EXISTS public.league_seasons (
  id        TEXT PRIMARY KEY,            -- '2026-W30' (ISO week label)
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at   TIMESTAMPTZ NOT NULL,
  CHECK (ends_at > starts_at)
);

-- 2) League memberships (IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS public.league_memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id       TEXT NOT NULL REFERENCES public.league_seasons(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id)         ON DELETE CASCADE,
  league_group_id TEXT    NOT NULL,        -- 't5_g3_2026-W30'
  tier            INT     NOT NULL CHECK (tier BETWEEN 1 AND 10),
  weekly_xp       INT     NOT NULL DEFAULT 0 CHECK (weekly_xp >= 0),
  accuracy_rate   REAL    NOT NULL DEFAULT 0 CHECK (accuracy_rate BETWEEN 0 AND 100),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, user_id)
);

-- 3) Indexes (IF NOT EXISTS).
CREATE INDEX IF NOT EXISTS idx_league_memberships_season_tier
  ON public.league_memberships (season_id, tier);

CREATE INDEX IF NOT EXISTS idx_league_memberships_user
  ON public.league_memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_league_seasons_starts_at
  ON public.league_seasons (starts_at DESC);

-- 4) updated_at maintenance trigger.
CREATE OR REPLACE FUNCTION public.league_memberships_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_league_memberships_touch_updated_at ON public.league_memberships;
CREATE TRIGGER trg_league_memberships_touch_updated_at
  BEFORE UPDATE ON public.league_memberships
  FOR EACH ROW EXECUTE FUNCTION public.league_memberships_touch_updated_at();

-- 5) RLS.
ALTER TABLE public.league_seasons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_memberships ENABLE ROW LEVEL SECURITY;

-- Public-readable seasons (weekly rollover is open knowledge).
DROP POLICY IF EXISTS "League seasons are public-readable" ON public.league_seasons;
CREATE POLICY "League seasons are public-readable"
  ON public.league_seasons FOR SELECT
  TO authenticated USING (true);

-- Guild-style leaderboard: any signed-in user can read everyone's row in
-- every tier. This matches the Duolingo convention the UI is patterned on.
DROP POLICY IF EXISTS "Authenticated members read league standings" ON public.league_memberships;
CREATE POLICY "Authenticated members read league standings"
  ON public.league_memberships FOR SELECT
  TO authenticated USING (true);

-- Users may only insert their own row, and only update their own row.
-- The frontend upserts with `onConflict: 'season_id,user_id'` so this
-- just enforces auth.uid() matches the user_id being written.
DROP POLICY IF EXISTS "Users insert own league membership" ON public.league_memberships;
CREATE POLICY "Users insert own league membership"
  ON public.league_memberships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own league membership" ON public.league_memberships;
CREATE POLICY "Users update own league membership"
  ON public.league_memberships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6) Bookkeeping per project convention (enforced in supabaseContract.test.ts
--    for any migration >= 20260713).
INSERT INTO schema_migrations (version, description)
VALUES ('20260719_league_tables', 'league_seasons + league_memberships with RLS and indexes')
ON CONFLICT (version) DO NOTHING;
