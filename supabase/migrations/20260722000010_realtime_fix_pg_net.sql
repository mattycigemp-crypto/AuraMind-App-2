-- AuraMind Database Migration: realtime_fix_pg_net (reconstructed backfill)
-- Date: 2026-07-22 · Remote CLI name: realtime_fix_pg_net · Version 20260722000010
--
-- Historical fix: pg_net >= 0.14 changed net.http_post's `body` parameter to
-- jsonb. The broadcast_user_notification() function shipped by
-- 20260722000000_realtime_notifications.sql already uses `body := jsonb`, so
-- this migration is a real, idempotent marker (COMMENT ON FUNCTION) that
-- preserves the fix's intent without duplicating the function body.

COMMENT ON FUNCTION public.broadcast_user_notification()
  IS 'Realtime notification trigger fn. net.http_post body is jsonb (pg_net >= 0.14); never cast to text.';

-- Migration bookkeeping (custom ledger)
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260722000010_realtime_fix_pg_net',
  'Reconstructed backfill: pg_net jsonb body fix marker for broadcast_user_notification()'
)
ON CONFLICT (version) DO NOTHING;
