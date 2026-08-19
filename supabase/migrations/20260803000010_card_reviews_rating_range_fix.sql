-- AuraMind Database Migration: card_reviews.rating → full FSRS range (0..5)
-- Date: 2026-07-24
-- Version: 3.8.0
--
-- Migration `20260717_missing_tables_and_rpcs.sql` defined
--     rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 4)
-- mirroring the Anki/SuperMemo-2 four-button scale (1..4). AuraMind's
-- in-app `Rating` enum (`src/types/index.ts`) instead uses FSRS v5
-- (0 = Again, 3 = Hard, 4 = Good, 5 = Easy). With the old CHECK every
-- "Easy" rating the user clicks propagates as `rating = 5` into the
-- card_reviews write — PostgREST rejects it with `23514 check_violation`
-- and the SessionReplayModal (which queries card_reviews) renders an
-- empty "Nothing to replay yet" because the row was never persisted.
--
-- Fix: drop the existing constraint and replace it with a relaxed
-- `rating >= 0 AND rating <= 5` bound. We intentionally cap at 5
-- (FSRS v5's maximum) rather than leaving the upper bound open — an open
-- bound is a foot-gun if a future caller mistakenly passes
-- `Number(Date.now())` or any other long into rating. A follow-on FSRS
-- v6 (if it ships a 6th rating) will need its own migration; we'd want
-- that surfaced in code review rather than silently swallowing arbitrary
-- numerics. Negative numbers remain rejected, NULL is still rejected by
-- the column's `NOT NULL`.
--
-- Cross-pollution note: pre-fix rows from `offlineStudyService.syncOfflineData`
-- may have used Anki-style ratings 1..4. The new constraint accepts those
-- as legitimate values; on the read side, `useSessionReplay.mapRating`
-- buckets 1..3 into 'hard' (a downgrade for legacy "good"=3 rows). If
-- great-fidelity replay of legacy rows matters, migrate them in a follow-up
-- data backfill (re-map 1→again, 2→hard, 3→good to match FSRS v5 anchors).
--
-- Idempotent: reapplying this migration is a no-op. Safe on a live DB:
-- no rows are mutated, only the constraint metadata changes.
--
-- Auto-name caveat: the original CHECK in `20260717_missing_tables_and_rpcs.sql`
-- is an inline column-level CHECK (`rating INTEGER ... CHECK (...)`). Postgres
-- auto-names that constraint `card_reviews_rating_check`. This file's DROP
-- targets that exact name; if a future migration renames or replaces the
-- constraint (e.g. via `ALTER TABLE ... RENAME CONSTRAINT`), this DROP
-- silently no-ops and the ADD below appends a SECOND concurrent CHECK on
-- the same column. Functional, but noisy in `pg_constraint`. To harden,
-- rewrite this file to introspect via `SELECT conname FROM pg_constraint
-- WHERE conrelid = 'public.card_reviews'::regclass AND conname LIKE
-- 'card_reviews_rating%'` before dropping. Out of scope today; flagged
-- for the next maintainer.

ALTER TABLE public.card_reviews
  DROP CONSTRAINT IF EXISTS card_reviews_rating_check;

ALTER TABLE public.card_reviews
  ADD CONSTRAINT card_reviews_rating_check
  CHECK (rating >= 0 AND rating <= 5);

COMMENT ON CONSTRAINT card_reviews_rating_check ON public.card_reviews
  IS 'Relaxed from 0..4 to 0..5 in 20260724000000 so FSRS v5 Rating.EASY (=5) writes succeed. Upper bound still capped to defend against accidental numeric-as-rating writes. Idempotent on re-apply.';

INSERT INTO schema_migrations (version, description)
VALUES ('20260803000010_card_reviews_rating_range_fix',
        'card_reviews.rating CHECK: 0..4 → 0..5 (supports FSRS v5 0=Again / 3=Hard / 4=Good / 5=Easy written by StudyModePage.handleRate and FlowMode.handleAnswer)')
ON CONFLICT (version) DO NOTHING;

-- Migration complete.
-- To verify:
--   SELECT conname, pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'public.card_reviews'::regclass
--      AND conname = 'card_reviews_rating_check';
