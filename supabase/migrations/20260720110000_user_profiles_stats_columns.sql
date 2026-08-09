-- AuraMind Database Migration: user_profiles stats columns + schema reload
-- Date: 2026-07-20
-- Version: 3.7.2
--
-- The original user_profiles table (pre-migration era) only has basic columns
-- like id, name, user_id. Many app pages query columns like xp, level,
-- email, streak_days, cards_studied, decks_created, sessions_completed,
-- title, full_name, last_study_date — which were never added.
-- This migration adds them all, plus triggers PostgREST to reload its
-- schema cache so the REST API immediately sees the new columns.

-- ============================================
-- 1. Add missing columns to user_profiles
-- ============================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cards_studied INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS decks_created INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sessions_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_study_date TIMESTAMPTZ;

-- ============================================
-- 2. Force PostgREST to reload schema cache
-- ============================================
-- After DDL changes, PostgREST needs to pick up the new columns.
-- This NOTIFY is the official Supabase way to trigger an immediate reload.
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 3. Bookkeeping
-- ============================================
INSERT INTO schema_migrations (version, description)
VALUES ('20260720_user_profiles_stats_columns',
        'Add xp, level, email, full_name, streak_days, cards_studied, decks_created, sessions_completed, title, last_study_date to user_profiles; force PostgREST schema reload')
ON CONFLICT (version) DO NOTHING;
