-- AuraMind Database Migration: sync_auth_role_and_fix_trigger (reconstructed backfill)
-- Date: 2026-07-24 · Remote CLI name: sync_auth_role_and_fix_trigger · Version 20260724000020
--
-- Reconstructed from the live database (pg_get_functiondef / pg_get_triggerdef):
-- syncs auth.users.raw_user_meta_data -> 'role' into user_profiles.role on
-- insert / role change, so the profile role never diverges from auth metadata.

CREATE OR REPLACE FUNCTION public.sync_auth_role_to_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := NEW.raw_user_meta_data ->> 'role';
  IF v_role IS NULL THEN
    v_role := 'user';
  END IF;

  INSERT INTO public.user_profiles (id, user_id, role)
  VALUES (NEW.id, NEW.id, v_role)
  ON CONFLICT (user_id)
    DO UPDATE SET role = EXCLUDED.role, id = EXCLUDED.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_auth_role ON auth.users;
CREATE TRIGGER trg_sync_auth_role
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_role_to_profiles();

-- Migration bookkeeping (custom ledger)
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260724000020_sync_auth_role_and_fix_trigger',
  'Reconstructed backfill: sync auth.users role metadata into user_profiles.role'
)
ON CONFLICT (version) DO NOTHING;
