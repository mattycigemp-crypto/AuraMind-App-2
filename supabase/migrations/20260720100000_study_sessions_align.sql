-- AuraMind Database Migration: study_sessions.deck_id nullable
-- Date: 2026-07-20
-- Version: 3.7.0
--
-- The pre-existing study_sessions table (introduced in migration 20260709_core_tables.sql)
-- declares `deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE`. The
-- SessionService.ts code paths used by the standard StudyModePage always carry a
-- non-null deck binding — but FlowMode's focus-session shell explicitly drops
-- the deck binding by design (the user is reviewing a curated cross-deck set),
-- and the live trace showed `400 Bad Request` on `POST /rest/v1/study_sessions`
-- whenever a FlowMode session resolved (FK + NOT NULL fail together = PostgREST
-- surfaces one 4xx per session).
--
-- We keep all existing columns untouched and only relax the NOT NULL on
-- `deck_id`. Idempotent and safe on a live DB — no data is dropped, no rows
-- are re-pointed.
--
-- The in-app StudySession type already models `deckId?` as optional, so JS
-- callers can pass `null` cleanly. The select path on sessionService
-- .fetchStudySessions surfaces `deck_id | null` directly — pre-existing rows
-- with a real deck id are unaffected.
--
-- Why this is additive-only:
--   - Drops the NOT NULL constraint (no row mutation; FK still enforced).
--   - Adds a single partial index for FlowMode session scans (group-by sessions
--     without a deck, useful for the streak widget when a user studies
--     entirely in FlowMode).
--   - Bookkeeping row on schema_migrations (post-20260713 convention).

-- ============================================
-- 1. Drop the NOT NULL constraint on deck_id
-- ============================================
-- CASCADE-safe: the FK to decks(id) remains intact. We only let the column
-- accept NULL so FlowMode's session-end `saveStudySession({deckId: undefined})`
-- can persist a focus-session row without violating the constraint.
ALTER TABLE public.study_sessions ALTER COLUMN deck_id DROP NOT NULL;

-- ============================================
-- 2. Partial index for FlowMode session scans
-- ============================================
-- Most study_sessions rows have a deck_id. Partial index lets the streak /
-- "focus today" widget filter just the deck-less rows cheaply without bloating
-- the primary (user_id, started_at DESC) index.
CREATE INDEX IF NOT EXISTS idx_study_sessions_no_deck
  ON public.study_sessions (user_id, started_at DESC)
  WHERE deck_id IS NULL;

-- ============================================
-- 3. Bookkeeping per project convention
-- ============================================
INSERT INTO schema_migrations (version, description)
VALUES ('20260720_study_sessions_align',
        'study_sessions.deck_id → nullable (FlowMode support) + partial index for focus sessions')
ON CONFLICT (version) DO NOTHING;

-- Migration complete.
-- To verify:
--   SELECT column_name, is_nullable FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='study_sessions' AND column_name IN ('deck_id','started_at','ended_at','cards_reviewed','cards_correct');
--   SELECT indexname FROM pg_indexes WHERE tablename = 'study_sessions' AND indexname = 'idx_study_sessions_no_deck';
