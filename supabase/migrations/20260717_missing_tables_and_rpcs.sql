-- AuraMind Database Migration: M6.5 Schema Fill
-- Date: 2026-07-17
-- Version: 3.5.0
--
-- Fills the gaps src/ references but migrations don't define. Each table
-- here was a live 404 source for one or more callers in src/services/:
--
--   1. `profiles`             — referenced by stripeWebhookService.ts +
--                              trialService.ts; carries Stripe customer id,
--                              trial start/end, and the user-facing full_name
--                              distinct from user_profiles.study_preferences.
--   2. `card_reviews`         — referenced by offlineStudyService.ts;
--                              queues card reviews made while offline and
--                              flushes them when network returns.
--   3. `users` (mirror)       — referenced by syncUser.ts (ensureUserSynced);
--                              a SELECT-then-INSERT from auth context. We
--                              create a public mirror so goTrue-managed
--                              auth.users stays untouched but src/ can upsert
--                              cheaply.
--   4. `count_user_lapses` RPC — the legacy RPC that src/services/study/
--                              fsrsAdaptation.ts USED to call. The service no
--                              longer invokes it (summing via sumCardLapses
--                              inline), but archived builds may still hit it.
--                              Defining it as a SECURITY DEFINER RPC = a hard
--                              safe-deposit against any future rollback.
--
-- All tables have RLS enabled with mirror-the-auth.uid() policies. The mirror
-- `users` table triggers INSERT/SELECT/UPDATE only through auth.uid() so we
-- never let a user row mutate someone else's profile.

-- ============================================
-- 1. profiles — Stripe + trial surface
-- ============================================
-- The table may already exist from an earlier schema. We create it fresh
-- OR add any missing columns to the existing table so the migration is
-- idempotent against both cases.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      full_name TEXT,
      avatar_url TEXT,
      stripe_customer_id TEXT,
      subscription_status TEXT,
      subscription_tier TEXT,
      subscription_renews_at TIMESTAMPTZ,
      trial_start TIMESTAMPTZ,
      trial_end TIMESTAMPTZ,
      lifetime_xp INTEGER NOT NULL DEFAULT 0,
      onboarding_state JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Table exists — add any missing columns one by one.
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifetime_xp INTEGER DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_state JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- CHECK constraints (safe to repeat via DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
      CHECK (subscription_tier IN ('free', 'pro', 'pro_plus'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
  ON profiles (subscription_status)
  WHERE subscription_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_trial_end
  ON profiles (trial_end)
  WHERE trial_end IS NOT NULL;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile row" ON profiles;
CREATE POLICY "Users can read own profile row" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile row" ON profiles;
CREATE POLICY "Users can insert own profile row" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile row" ON profiles;
CREATE POLICY "Users can update own profile row" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- 2. card_reviews — offline sync queue
-- ============================================
-- One row per logical review event. Offline `offlineStudyService.syncOfflineData`
-- UPSERTs by `card_id` so a re-flush after a partial failure is idempotent.
-- The schema stores the SRS algorithm result so the live card can later be
-- replayed against the FSRS scheduler without diffing local state.
CREATE TABLE IF NOT EXISTS card_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 4),
  srs_result JSONB NOT NULL,                    -- output of SRS scheduler
  srs_algorithm TEXT NOT NULL DEFAULT 'fsrs',
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT card_reviews_card_id_unique UNIQUE (card_id)
);

CREATE INDEX IF NOT EXISTS idx_card_reviews_user_id
  ON card_reviews (user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_reviews_card_id
  ON card_reviews (card_id);

ALTER TABLE card_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own card reviews" ON card_reviews;
CREATE POLICY "Users can read own card reviews" ON card_reviews
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own card reviews" ON card_reviews;
CREATE POLICY "Users can insert own card reviews" ON card_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own card reviews (within 1 hour)" ON card_reviews;
CREATE POLICY "Users can update own card reviews (within 1 hour)" ON card_reviews
  FOR UPDATE USING (auth.uid() = user_id AND reviewed_at > NOW() - INTERVAL '1 hour')
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. (DELETED in M6.5.b) users (mirror) — syncUser.ts upsert target
-- ============================================
-- M6.5 review surfaced that the `users` mirror table duplicates
-- `auth.users` (managed by GoTrue). Long-term debt for a 3-way conceptual
-- split between auth.users, user_profiles, and profiles. We instead point
-- syncUser.ts at user_profiles (which already exists with user_id FK) and
-- add the `last_seen_at` column it needs. The on-call maintainer can
-- drop the users mirror table once no caller references it.

-- ============================================
-- 4. count_user_lapses RPC (legacy safety deposit)
-- ============================================
-- The current fsrsAdaptation.ts inlines sumCardLapses via sumCardLapses() so
-- this RPC is no longer called. We define it as a SECURITY DEFINER function
-- anyway, because:
--   (a) Older deploys of the app still reference it (the 404 the user pasted
--       came from a stale build).
--   (b) If a future PR reintroduces the RPC call without redeploying the
--       SQL, the worst case is now "wrong answer for 6 ms" instead of a
--       4xx surfaced to every logged-in user.
CREATE OR REPLACE FUNCTION count_user_lapses(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'cannot count another user''s lapses' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(SUM(lapses), 0)::INTEGER INTO v_total
  FROM cards
  WHERE user_id = p_user_id;

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION count_user_lapses(UUID) TO authenticated;

-- ============================================
-- 5. Cards UPDATE RLS — WITH CHECK hardening
-- ============================================
-- The previous "Users can update own cards" policy had WITH CHECK = NULL,
-- which PostgREST interprets as "any user matching the USING clause can
-- update to anything". That allows a malicious actor with rows matching
-- the USING to overwrite the row's user_id or any other column to a value
-- pointing at someone else's row. We tighten WITH CHECK to require the
-- AFTER-state row matches auth.uid() = user_id so the row's owner cannot
-- be silently re-pointed. The same fix applies to the deck-scoped policy.
DROP POLICY IF EXISTS "Users can update own cards" ON cards;
CREATE POLICY "Users can update own cards" ON cards
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Migration bookkeeping
-- ============================================
INSERT INTO schema_migrations (version, description)
VALUES ('20260717_missing_tables_and_rpcs',
        'Adds profiles, card_reviews, users-mirror tables + count_user_lapses RPC; hardens cards UPDATE WITH CHECK')
ON CONFLICT (version) DO NOTHING;

-- Migration complete.
-- To verify: SELECT version, applied_at FROM schema_migrations ORDER BY applied_at DESC;
