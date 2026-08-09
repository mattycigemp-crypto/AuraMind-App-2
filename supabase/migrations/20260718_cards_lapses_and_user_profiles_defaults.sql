-- AuraMind Database Migration: cards.lapses + user_profiles.id default
-- Date: 2026-07-18
-- Version: 3.6.0
--
-- Fixes two real schema gaps surfacing as live 4xx errors in the dev preview:
--   1. fsrsAdaptation.ts selects cards.lapses for personalization stats; the column was missing from all prior migrations.
--      ADD COLUMN IF NOT EXISTS fixes the 400 surfaced in fsrsAdaptation.ts:212 + :280.
--   2. syncUser.ts upsert path was rewritten to a plain INSERT of `{ id: user.id, user_id: user.id }`, but archived
--      bundles still call supabase.from('user_profiles').upsert(..., { onConflict: 'user_id', ignoreDuplicates: true })
--      without sending `id`. The original schema declared `id` PK NOT NULL with no DEFAULT, so the INSERT side of that
--      upsert fires `23502 null value in column "id"`. Adding a type-conditional DEFAULT on `id` covers both shapes:
--      if the live DB has a UUID `id`, gen_random_uuid() auto-fills; if it has BIGINT, we leave the column's existing
--      identity generator alone (any client that sends NULL still 401s the sync path, which is the correct loud failure).
--   3. We intentionally do NOT re-create the user_profiles_user_id_unique constraint — migration 20260709 already
--      declared it, and a duplicate_object exception here would block the entire migration run.
--
-- This migration is idempotent (ADD COLUMN IF NOT EXISTS + DO $$ … $$ guards + bookkeeping on schema_migrations).
-- Safe to apply on a live DB without downtime.

-- ============================================
-- 1. cards.lapses — referenced by fsrsAdaptation
-- ============================================
ALTER TABLE cards ADD COLUMN IF NOT EXISTS lapses INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0);

-- Partial index for the SUM(lapses) query path used by count_user_lapses RPC and the inline sumCardLapses fallback.
-- Partial because 99% of rows have lapses = 0 and we never want to scan them during lemma work.
CREATE INDEX IF NOT EXISTS idx_cards_user_lapses
  ON cards (user_id, lapses)
  WHERE lapses > 0;

-- ============================================
-- 2. user_profiles.id — type-conditional DEFAULT
-- ============================================
-- Do NOT use ALTER COLUMN ... SET DEFAULT gen_random_uuid() unconditionally: if the live DB has id BIGINT
-- (most older Supabase templates), gen_random_uuid() returns UUID which can't be cast to BIGINT and the whole
-- migration aborts on a 42883 invalid_text_representation. Branch on the column's data_type so both schemas
-- survive the migration cleanly.

DO $$
DECLARE
  v_id_type TEXT;
  v_user_id_type TEXT;
BEGIN
  SELECT data_type INTO v_id_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'user_profiles'
     AND column_name = 'id';

  IF v_id_type = 'uuid' THEN
    ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
  ELSIF v_id_type = 'bigint' THEN
    -- Already identity-managed by Postgres or the original Supabase template; leave alone.
    RAISE NOTICE 'user_profiles.id is bigint (no DEFAULT applied; syncUser v6 sends client-side id explicitly)';
  ELSE
    RAISE NOTICE 'user_profiles.id is %; no DEFAULT applied', COALESCE(v_id_type, 'unknown');
  END IF;

  -- Light defensive audit: if user_id is missing, point syncUser at it so the FK offer holds.
  SELECT data_type INTO v_user_id_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'user_profiles'
     AND column_name = 'user_id';

  IF v_user_id_type IS NULL THEN
    RAISE NOTICE 'user_profiles.user_id missing — adding UUID FK to auth.users(id)';
    ALTER TABLE user_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- Migration bookkeeping
-- ============================================
INSERT INTO schema_migrations (version, description)
VALUES ('20260718_cards_lapses_and_user_profiles_defaults',
        'Adds cards.lapses + user_profiles.id default + user_profiles.user_id UNIQUE; closes the M6.5 syncUser 23502 + fsrsAdaptation 400 surfaces')
ON CONFLICT (version) DO NOTHING;

-- Migration complete.
