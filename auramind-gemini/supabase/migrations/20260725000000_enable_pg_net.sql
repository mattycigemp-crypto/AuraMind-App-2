-- Enable pg_net extension (required by broadcast_user_notification trigger)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Fix the trigger function: net.http_post lives in extensions schema,
-- and NEW.cards_reviewed was wrong (column is cards_studied).
DROP TRIGGER IF EXISTS trg_study_session_notify ON study_sessions;
DROP TRIGGER IF EXISTS trg_league_xp_notify ON league_memberships;
DROP TRIGGER IF EXISTS trg_profile_streak_notify ON user_profiles;

CREATE OR REPLACE FUNCTION broadcast_user_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $func$
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
$func$;

-- Recreate triggers
CREATE TRIGGER trg_study_session_notify
  AFTER INSERT ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_user_notification();

CREATE TRIGGER trg_league_xp_notify
  AFTER UPDATE OF weekly_xp ON league_memberships
  FOR EACH ROW
  WHEN (NEW.weekly_xp IS DISTINCT FROM OLD.weekly_xp)
  EXECUTE FUNCTION broadcast_user_notification();

CREATE TRIGGER trg_profile_streak_notify
  AFTER UPDATE OF streak ON user_profiles
  FOR EACH ROW
  WHEN (NEW.streak IS DISTINCT FROM OLD.streak)
  EXECUTE FUNCTION broadcast_user_notification();
