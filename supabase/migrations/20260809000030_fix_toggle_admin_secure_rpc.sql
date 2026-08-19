-- Fix: repair public.toggle_admin_secure().
--
-- The previous body used `EXECUTE format('UPDATE ... SET role = $1, is_admin
-- = $2, updated_at = NOW() WHERE user_id = $3', ...)` WITHOUT a USING clause.
-- format() has no %-specifiers, so the three arguments were discarded, and
-- EXECUTE then ran the literal string with unbound $1/$2/$3 — raising "there
-- is no parameter $1", which the `EXCEPTION WHEN OTHERS` handler swallowed.
-- Net effect: the RPC silently no-opped every time.
--
-- user_profiles has `role` and `user_id` but NOT `is_admin` or `updated_at`,
-- so the repaired UPDATE targets only the columns that exist. Authorization
-- itself is unchanged: current_user_is_admin() (app_metadata.role) gates the
-- call, and admin_roles remains the DB-side source of truth. user_profiles.role
-- is display-only.

CREATE OR REPLACE FUNCTION public.toggle_admin_secure(p_target_uuid uuid, p_make_admin boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_target_email TEXT;
  v_target_meta JSONB;
BEGIN
  IF NOT current_user_is_admin() THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  -- Don't let non-owners demote owners.
  SELECT email, raw_user_meta_data
    INTO v_target_email, v_target_meta
    FROM auth.users
    WHERE id = p_target_uuid;

  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT p_make_admin AND (v_target_meta->>'role') = 'owner' THEN
    RAISE EXCEPTION 'cannot demote owner' USING ERRCODE = '42501';
  END IF;

  -- Update only the display-only role column that actually exists.
  UPDATE public.user_profiles
     SET role = CASE WHEN p_make_admin THEN 'admin' ELSE 'user' END
   WHERE user_id = p_target_uuid;

  RETURN jsonb_build_object(
    'id', p_target_uuid::text,
    'role', CASE WHEN p_make_admin THEN 'admin' ELSE 'user' END,
    'is_admin', p_make_admin
  );
END;
$function$;

-- ── Bookkeeping ─────────────────────────────────────────────────────────
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260809000030_fix_toggle_admin_secure_rpc',
  'Repair toggle_admin_secure: replace the unbound-parameter EXECUTE with a direct UPDATE of the existing user_profiles.role column'
)
ON CONFLICT (version) DO NOTHING;
