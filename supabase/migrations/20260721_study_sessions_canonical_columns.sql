-- 20260721_study_sessions_canonical_columns.sql
--
-- Adds the full set of columns that sessionService.saveStudySession writes.
-- Until now only cards_correct / cards_reviewed / started_at / ended_at existed;
-- the service was also sending cards_studied / correct_answers / total_answers /
-- accuracy / duration, which silently failed in PostgREST (PGRST204 every save).
--
-- DECISION: additive migration, no renames. Existing cards_correct / cards_reviewed
-- rows stay queryable so the useStudyStats hook and any historical analytics keep
-- working while the new columns become canonical for new sessions.

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS cards_studied    INTEGER,
  ADD COLUMN IF NOT EXISTS correct_answers  INTEGER,
  ADD COLUMN IF NOT EXISTS total_answers    INTEGER,
  ADD COLUMN IF NOT EXISTS accuracy         INTEGER CHECK (accuracy IS NULL OR (accuracy BETWEEN 0 AND 100)),
  ADD COLUMN IF NOT EXISTS duration_ms      BIGINT;

COMMENT ON COLUMN public.study_sessions.cards_studied   IS 'Total cards answered in this session (may differ from cards_reviewed which tracks ever-seen)';
COMMENT ON COLUMN public.study_sessions.correct_answers IS 'Count of ratings >= "Good" treated as correct';
COMMENT ON COLUMN public.study_sessions.total_answers   IS 'Same as cards_studied today, kept distinct for future partial-completion sessions';
COMMENT ON COLUMN public.study_sessions.accuracy        IS 'Integer 0-100 percentage of correct_answers / total_answers';
COMMENT ON COLUMN public.study_sessions.duration_ms     IS 'Session duration in milliseconds (started_at → ended_at)';

INSERT INTO schema_migrations (version, description)
VALUES ('20260721_study_sessions_canonical_columns', 'Adds canonical session columns: cards_studied, correct_answers, total_answers, accuracy, duration_ms')
ON CONFLICT (version) DO NOTHING;
