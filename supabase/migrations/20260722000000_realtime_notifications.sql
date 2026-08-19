-- AuraMind Database Migration: realtime_notifications (reconstructed backfill)
-- Date: 2026-07-22 · Remote CLI name: realtime_notifications · Version 20260722000000
--
-- This file was originally an empty `_remote_only` placeholder that only
-- mirrored the remote ledger version. Its content has been reconstructed from
-- the live database (pg_get_functiondef / pg_get_triggerdef) so a fresh
-- `supabase db reset` reproduces the real notification system instead of a
-- no-op.
--
-- Creates:
--   - public.broadcast_user_notification() — SECURITY DEFINER trigger
--     function that POSTs to the `realtime-notify` edge function via pg_net's
--     net.http_post (jsonb body; pg_net >= 0.14, never cast to text).
--   - trg_profile_streak_notify + trg_league_xp_notify. The study-session
--     trigger is owned by 20260724000000_fix_study_session_trigger.sql.
--
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS.

CREATE OR REPLACE FUNCTION public.broadcast_user_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user_id TEXT;
  v_payload JSONB;
  v_event TEXT;
  v_edge_url CONSTANT TEXT := 'https://ndwiaawqkkzdsdqeglez.supabase.co/functions/v1/realtime-notify';
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'study_sessions' THEN
      v_user_id := NEW.user_id::TEXT;
      v_event := 'study_session_completed';
      v_payload := jsonb_build_object(
        'type', 'study_session',
        'event', v_event,
        'cards_studied', NEW.cards_studied,
        'duration_minutes', NEW.duration_ms / 60000,
        'accuracy', NEW.accuracy,
        'timestamp', extract(epoch from now()) * 1000
      );
    WHEN 'league_memberships' THEN
      v_user_id := NEW.user_id::TEXT;
      v_event := 'league_xp_changed';
      v_payload := jsonb_build_object(
        'type', 'league',
        'event', v_event,
        'weekly_xp', NEW.weekly_xp,
        'tier', NEW.tier,
        'league_group', NEW.league_group_id,
        'timestamp', extract(epoch from now()) * 1000
      );
    WHEN 'user_profiles' THEN
      v_user_id := NEW.user_id::TEXT;
      v_event := 'streak_updated';
      v_payload := jsonb_build_object(
        'type', 'profile',
        'event', v_event,
        'streak', NEW.streak,
        'timestamp', extract(epoch from now()) * 1000
      );
    ELSE
      RETURN NULL;
  END CASE;

  -- body is jsonb (pg_net >= 0.14). Do NOT cast to text.
  PERFORM net.http_post(
    url := v_edge_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'channel', 'user:' || v_user_id || ':notifications',
      'event', 'broadcast',
      'payload', v_payload
    ),
    timeout_milliseconds := 5000
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_streak_notify ON public.user_profiles;
CREATE TRIGGER trg_profile_streak_notify
  AFTER UPDATE OF streak ON public.user_profiles
  FOR EACH ROW
  WHEN (new.streak IS DISTINCT FROM old.streak)
  EXECUTE FUNCTION public.broadcast_user_notification();

DROP TRIGGER IF EXISTS trg_league_xp_notify ON public.league_memberships;
CREATE TRIGGER trg_league_xp_notify
  AFTER UPDATE OF weekly_xp ON public.league_memberships
  FOR EACH ROW
  WHEN (new.weekly_xp IS DISTINCT FROM old.weekly_xp)
  EXECUTE FUNCTION public.broadcast_user_notification();

-- Migration bookkeeping (custom ledger)
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260722000000_realtime_notifications',
  'Reconstructed backfill: broadcast_user_notification() trigger fn + profile/league notify triggers'
)
ON CONFLICT (version) DO NOTHING;
