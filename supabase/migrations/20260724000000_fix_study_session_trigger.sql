-- AuraMind Database Migration: fix_study_session_trigger (reconstructed backfill)
-- Date: 2026-07-24 · Remote CLI name: fix_study_session_trigger · Version 20260724000000
--
-- This version was previously occupied locally by an unrelated
-- card_reviews_backfill migration (moved to supabase/migrations-extra/, where
-- the custom runner owns it). The remote CLI ledger records this version as
-- fix_study_session_trigger, whose effect is the study-session completion
-- notification trigger below.
--
-- Idempotent: DROP TRIGGER IF EXISTS + CREATE TRIGGER.

DROP TRIGGER IF EXISTS trg_study_session_notify ON public.study_sessions;
CREATE TRIGGER trg_study_session_notify
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_user_notification();

-- Migration bookkeeping (custom ledger)
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260724000000_fix_study_session_trigger',
  'Reconstructed backfill: study-session completion notify trigger'
)
ON CONFLICT (version) DO NOTHING;
