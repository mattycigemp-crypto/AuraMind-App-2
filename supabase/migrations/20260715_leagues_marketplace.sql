-- AuraMind Database Migration: Leagues + Deck Marketplace
-- Date: 2026-07-15
-- Version: 3.3.0
--
-- Adds:
--   1. league_seasons    — one row per ISO week (UTC Monday cutoff)
--   2. league_memberships — one row per user per season, tracks weekly XP
--   3. Public deck marketplace columns (is_public, fork_count, original_deck_id, category, tags)

-- ============================================
-- 1. LEAGUE_SEASONS — one row per week
-- ============================================
CREATE TABLE IF NOT EXISTS league_seasons (
  id TEXT PRIMARY KEY,                       -- 'YYYY-Www' ISO week label
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE league_seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read league seasons" ON league_seasons;
CREATE POLICY "Anyone can read league seasons" ON league_seasons
  FOR SELECT USING (true);

-- Seed current week so leaderboard doesn't crash on first load
INSERT INTO league_seasons (id, starts_at, ends_at)
SELECT
  to_char(date_trunc('week', NOW()), 'YYYY-"W"IW') AS id,
  date_trunc('week', NOW()) AS starts_at,
  date_trunc('week', NOW()) + INTERVAL '7 days' AS ends_at
WHERE NOT EXISTS (
  SELECT 1 FROM league_seasons
  WHERE id = to_char(date_trunc('week', NOW()), 'YYYY-"W"IW')
);

-- ============================================
-- 2. LEAGUE_MEMBERSHIPS — user progress per week
-- ============================================
CREATE TABLE IF NOT EXISTS league_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  league_group_id TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier >= 1 AND tier <= 10),
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  accuracy_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, user_id)
);

ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read league memberships" ON league_memberships;
CREATE POLICY "Anyone can read league memberships" ON league_memberships
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own league membership" ON league_memberships;
CREATE POLICY "Users can insert own league membership" ON league_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own league membership" ON league_memberships;
CREATE POLICY "Users can update own league membership" ON league_memberships
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Performance: fast group queries sorted by weekly_xp desc within a season
CREATE INDEX IF NOT EXISTS idx_league_group_leaderboard
  ON league_memberships (season_id, league_group_id, weekly_xp DESC);

CREATE INDEX IF NOT EXISTS idx_league_user_lookup
  ON league_memberships (user_id, season_id DESC);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_league_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_league_memberships_updated_at ON league_memberships;
CREATE TRIGGER trg_league_memberships_updated_at
  BEFORE UPDATE ON league_memberships
  FOR EACH ROW EXECUTE FUNCTION update_league_memberships_updated_at();

-- ============================================
-- 3. DECKS — public marketplace columns
-- ============================================
ALTER TABLE decks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS original_deck_id UUID REFERENCES decks(id) ON DELETE SET NULL;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS marketplace_category TEXT;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS marketplace_tags TEXT[] DEFAULT '{}';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS marketplace_description TEXT;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_decks_public_browse
  ON decks (is_public, marketplace_category)
  WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_decks_forked_from
  ON decks (original_deck_id);

-- RLS for marketplace visibility: public decks are read by everyone
DROP POLICY IF EXISTS "Anyone can view public decks" ON decks;
CREATE POLICY "Anyone can view public decks" ON decks
  FOR SELECT USING (
    is_public = TRUE
    OR auth.uid() = user_id
  );

-- Don't grant broad UPDATE on decks; instead expose a narrow SECURITY DEFINER
-- RPC that only touches fork_count atomically. This prevents users from
-- mutating other public-deck columns (e.g. user_id/title/description).
CREATE OR REPLACE FUNCTION bump_forks_and_unpublish(
  p_deck_id UUID,
  p_unpublish BOOLEAN DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
BEGIN
  IF p_unpublish THEN
    -- Only the deck owner may unpublish — surface errors loudly so the client knows.
    SELECT user_id INTO v_owner FROM decks WHERE id = p_deck_id;
    IF v_owner IS NULL THEN
      RAISE EXCEPTION 'deck not found' USING ERRCODE = 'P0002';
    ELSIF v_owner <> auth.uid() THEN
      RAISE EXCEPTION 'not deck owner' USING ERRCODE = '42501';
    ELSE
      UPDATE decks SET is_public = FALSE WHERE id = p_deck_id;
    END IF;
  ELSE
    -- Anyone may bump fork_count on a public deck.
    UPDATE decks SET fork_count = fork_count + 1
    WHERE id = p_deck_id AND is_public = TRUE;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION bump_forks_and_unpublish(UUID, BOOLEAN) TO authenticated, anon;

-- Record migration
INSERT INTO schema_migrations (version, description)
VALUES ('20260715_leagues_marketplace', 'Add league system + deck marketplace columns')
ON CONFLICT (version) DO NOTHING;
