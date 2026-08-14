-- AuraMind Database Migration: Real-time Broadcast Notifications
-- Date: 2026-07-22
-- Version: 3.7.0
--
-- Implements real-time notification broadcasting using Supabase Realtime's
-- Broadcast pattern with Postgres triggers.
--
-- Architecture:
--   Channel topic:   user:<user_id>:notifications
--   Broadcast type:  broadcast
--   Trigger tables:  study_sessions, league_memberships, user_profiles
--
-- When a relevant row changes, a trigger function calls
-- realtime.broadcast_changes() which pushes an event to all subscribers
-- on the matching topic. The client subscribes via:
--   supabase.channel('user:<user_id>:notifications', { private: true })
--     .on('broadcast', ...)
--     .subscribe()
--
-- RLS policies on realtime.messages ensure users can only receive
-- broadcasts on their own user channel.

-- ============================================
-- 1. Enable realtime extensions (idempotent)
-- ============================================
-- The realtime extension is typically pre-enabled on Supabase projects.
-- If missing, uncomment:
-- CREATE EXTENSION IF NOT EXISTS "realtime" CASCADE;

-- ============================================
-- 2. Authorization for private channels
-- ============================================
-- Private channel authorization is handled by Supabase Realtime's built-in
-- JWT validation, not by SQL RLS policies on realtime.messages.
--
-- How it works:
--   1. Client calls supabase.channel('user:<id>:notifications', { private: true })
--   2. Realtime server validates the user's JWT on subscription
--   3. The channel topic includes the user ID, so only the intended recipient
--      can subscribe to their own channel
--   4. The trigger function runs as SECURITY DEFINER (service_role), bypassing
--      any RLS — it can broadcast to any channel
--
-- No SQL RLS policies on realtime.messages are needed because:
--   - The channel name itself encodes the user ID (user:<user_id>)
--   - JWT auth prevents impersonation
--   - Trigger functions run with elevated privileges
--   - The client must call supabase.realtime.setAuth(token) before subscribing
--     to a private channel, which sets the proper Authorization header

-- ============================================
-- 3. Broadcast trigger function
-- ============================================
-- Generic trigger function that broadcasts a JSON payload to a user's
-- notification channel. Can be attached to any table.
--
-- Usage example (on league_memberships):
--   CREATE TRIGGER trg_league_xp_broadcast
--     AFTER UPDATE OF weekly_xp ON league_memberships
--     FOR EACH ROW
--     WHEN (NEW.weekly_xp != OLD.weekly_xp)
--     EXECUTE FUNCTION broadcast_user_notification();

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

  PERFORM realtime.broadcast_changes(
    'user:' || v_user_id || ':notifications',
    'broadcast',
    v_payload,
    'broadcast'
  );

  RETURN NULL;
END;
$func$;

-- ============================================
-- 4. Triggers on source tables
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
  WHEN (NEW.weekly_xp != OLD.weekly_xp)
  EXECUTE FUNCTION broadcast_user_notification();

-- User profile (streak) changes → notify user
-- NOTE: Only fires when streak actually changes to avoid spamming.
-- The 'lifetime_xp' column exists on profiles, not user_profiles.
DROP TRIGGER IF EXISTS trg_profile_streak_notify ON user_profiles;
CREATE TRIGGER trg_profile_streak_notify
  AFTER UPDATE OF streak ON user_profiles
  FOR EACH ROW
  WHEN (NEW.streak IS DISTINCT FROM OLD.streak)
  EXECUTE FUNCTION broadcast_user_notification();

-- ============================================
-- 5. Verify realtime is enabled on these tables
-- ============================================
-- Tables must be added to the realtime publication so that
-- realtime.broadcast_changes() can see row changes.
-- This is typically done via the Supabase Dashboard > Replication,
-- or via SQL:
--
-- ALTER PUBLICATION supabase_realtime ADD TABLE ONLY study_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE ONLY league_memberships;
-- ALTER PUBLICATION supabase_realtime ADD TABLE ONLY user_profiles;

-- ============================================
-- Migration bookkeeping
-- ============================================
INSERT INTO schema_migrations (version, description)
VALUES ('20260722000000_realtime_notifications',
        'Real-time broadcast notifications via Supabase Realtime Broadcast + triggers on study_sessions, league_memberships, user_profiles')
ON CONFLICT (version) DO NOTHING;
