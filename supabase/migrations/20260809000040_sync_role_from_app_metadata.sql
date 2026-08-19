-- Fix: sync_auth_role_to_profiles() must read app_metadata, not user_metadata.
--
-- user_metadata is writable by any signed-in client via auth.updateUser(), so
-- trusting `raw_user_meta_data->>'role'` let a user persist a spoofed
-- role='admin'/'owner' into user_profiles.role. Authorization reads
-- app_metadata.role (current_user_is_admin / isAdminUser) and admin_roles
-- (is_admin/is_super_admin) — user_profiles.role is display-only — but the
-- trigger should still mirror the trusted source. This changes the read to
-- raw_app_meta_data; the authz path is unchanged.

CREATE OR REPLACE FUNCTION public.sync_auth_role_to_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  v_role := NEW.raw_app_meta_data ->> 'role';
  IF v_role IS NULL THEN
    v_role := 'user';
  END IF;

  INSERT INTO public.user_profiles (id, user_id, role)
  VALUES (NEW.id, NEW.id, v_role)
  ON CONFLICT (user_id)
    DO UPDATE SET role = EXCLUDED.role, id = EXCLUDED.id;

  RETURN NEW;
END;
$function$;

-- ── Bookkeeping ─────────────────────────────────────────────────────────
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260809000040_sync_role_from_app_metadata',
  'sync_auth_role_to_profiles: read raw_app_meta_data.role instead of attacker-writable raw_user_meta_data.role'
)
ON CONFLICT (version) DO NOTHING;
