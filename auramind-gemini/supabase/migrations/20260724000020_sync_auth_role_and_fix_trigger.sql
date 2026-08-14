-- AuraMind Migration: Sync auth.users metadata role → user_profiles.role
-- and ensure study_sessions trigger uses correct column names.
-- Date: 2026-07-24

-- 1) Create (or replace) the function that copies role from auth metadata
CREATE OR REPLACE FUNCTION public.sync_auth_role_to_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_role TEXT;
BEGIN
  v_role := NEW.raw_user_meta_data ->> 'role';

  IF v_role IS NULL THEN
    v_role := 'user';
  END IF;

  INSERT INTO public.user_profiles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id)
    DO UPDATE SET role = EXCLUDED.role;

  RETURN NEW;
END;
$func$;

-- 2) Attach the trigger to auth.users (runs after sign-up or metadata update)
DROP TRIGGER IF EXISTS trg_sync_auth_role ON auth.users;
CREATE TRIGGER trg_sync_auth_role
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_role_to_profiles();

-- 3) Ensure the study_sessions broadcast trigger uses the real column names.
--    This is a safety net: if 20260724000000 already ran correctly the
--    CREATE TRIGGER IF NOT EXISTS is a no-op, but if the trigger is still
--    pointing at the wrong columns we rebuild it.
DROP TRIGGER IF EXISTS trg_study_session_notify ON study_sessions;

CREATE TRIGGER trg_study_session_notify
  AFTER INSERT ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_user_notification();

-- 4) Bookkeeping
INSERT INTO schema_migrations (version, description)
VALUES ('20260724000020_sync_auth_role_and_fix_trigger',
        'Create sync_auth_role_to_profiles trigger on auth.users and ensure study_sessions trigger uses duration_ms/accuracy')
ON CONFLICT (version) DO NOTHING;
