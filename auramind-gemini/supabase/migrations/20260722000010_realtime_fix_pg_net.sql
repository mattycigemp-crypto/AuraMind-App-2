-- AuraMind Database Migration: Fix Realtime Notifications via pg_net
-- Date: 2026-07-22
-- Version: 3.7.1
--
-- The previous migration (20260722000000) referenced realtime.broadcast_changes(),
-- a PostgreSQL function that exists only in the `realtime` extension. That extension
-- is NOT available on this Supabase project. The migration created:
--   1. broadcast_user_notification() function  → broken (references nonexistent func)
--   2. 3 triggers firing that function         → broken (call a broken func)
--
-- Fix: Use pg_net (available at v0.19.5) to POST to a Supabase Edge Function that
-- broadcasts to Realtime using the @supabase/supabase-js SDK with service role key.
--
-- Architecture:
--   DB Trigger fires
--     ↓
--   broadcast_user_notification()  [SECURITY DEFINER]
--     ↓
--   net.http_post() — POST to https://{project}.supabase.co/functions/v1/realtime-notify
--     ↓
--   Edge Function creates Supabase client with service role key, subscribes to
--   the user's private Realtime channel, sends broadcast, cleans up.
--     ↓
--   Client receives 'broadcast' event via .on('broadcast', ...)


-- ============================================
-- 1. Drop the broken objects from 20260722000000
-- ============================================

DROP TRIGGER IF EXISTS trg_study_session_notify ON study_sessions;
DROP TRIGGER IF EXISTS trg_league_xp_notify ON league_memberships;
DROP TRIGGER IF EXISTS trg_profile_streak_notify ON user_profiles;
DROP FUNCTION IF EXISTS broadcast_user_notification();


-- ============================================
-- 2. Recreate with pg_net + Edge Function
-- ============================================

-- The project ref for the Edge Function URL.
-- Production: ndwiaawqkkzdsdqeglez (newermind..)
CREATE OR REPLACE FUNCTION broadcast_user_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id TEXT;
  v_payload JSONB;
  v_event TEXT;
  -- Hardcoded URL because SET requires superuser.
  -- Change this in a future migration if the project ref or function name changes.
  v_edge_url CONSTANT TEXT := 'https://ndwiaawqkkzdsdqeglez.supabase.co/functions/v1/realtime-notify';
  v_headers JSONB;
  v_body TEXT;
BEGIN
  -- Determine user, event name, and payload based on the triggering table
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
      -- Unknown table — silently ignore
      RETURN NULL;
  END CASE;

  -- Build headers for the Edge Function call
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json'
  );

  -- Build the request body
  v_body := jsonb_build_object(
    'channel', 'user:' || v_user_id || ':notifications',
    'event', 'broadcast',
    'payload', v_payload
  )::text;

  -- Fire-and-forget HTTP POST to the Edge Function via pg_net
  -- net.http_post() is async — it returns immediately and the HTTP
  -- request happens asynchronously. The trigger doesn't wait for a response.
  PERFORM net.http_post(
    url := v_edge_url,
    headers := v_headers,
    body := v_body,
    timeout_milliseconds := 5000
  );

  RETURN NULL;
END;
$func$;


-- ============================================
-- 3. Recreate triggers (same as before)
-- ============================================

-- Study session completed → notify user
DROP TRIGGER IF EXISTS trg_study_session_notify ON study_sessions;
CREATE TRIGGER trg_study_session_notify
  AFTER INSERT ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_user_notification();

-- League XP changes → notify user
DROP TRIGGER IF EXISTS trg_league_xp_notify ON league_memberships;
CREATE TRIGGER trg_league_xp_notify
  AFTER UPDATE OF weekly_xp ON league_memberships
  FOR EACH ROW
  WHEN (NEW.weekly_xp IS DISTINCT FROM OLD.weekly_xp)
  EXECUTE FUNCTION broadcast_user_notification();

-- User profile (streak) changes → notify user
DROP TRIGGER IF EXISTS trg_profile_streak_notify ON user_profiles;
CREATE TRIGGER trg_profile_streak_notify
  AFTER UPDATE OF streak ON user_profiles
  FOR EACH ROW
  WHEN (NEW.streak IS DISTINCT FROM OLD.streak)
  EXECUTE FUNCTION broadcast_user_notification();


-- ============================================
-- 4. Migration bookkeeping
-- ============================================
INSERT INTO schema_migrations (version, description)
VALUES ('20260722000010_realtime_fix_pg_net',
        'Fix realtime notifications: replace realtime.broadcast_changes() with net.http_post() → Edge Function')
ON CONFLICT (version) DO NOTHING;
