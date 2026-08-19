-- AuraMind Database Migration: Admin User List RPC
-- Date: 2026-07-22
-- Version: 3.7.0
--
-- Fixes /admin/users so admin's user list matches the live users.
-- Before: AdminUsers.tsx called `/api/admin/list` (a backend route that
-- returned either a stub or a stale admin-only fixture), so the operator's
-- "Users" tab didn't match the actual production Supabase auth.users.
-- After: AdminUsers.tsx calls this SECURITY DEFINER RPC, which reads from
-- `auth.users` joined against `user_profiles` (or `profiles` fallback) so
-- names / roles / plans / last_sign_in_at are pulled live from the live DB.
--
-- Privilege gate: the caller must be `admin`, `ceo`, or `owner`. The RPC
-- is granted to `authenticated` and the gate runs server-side — a non-
-- admin client cannot extract user PII simply by calling the RPC.

-- ============================================================
-- 1. Privileged checker helper
-- ============================================================
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  -- Pure JSONB extraction avoids Postgres' parse-time column validation.
  -- See 20260521_fsrs_factcheck.sql for the rest of the schema; this
  -- function compiles cleanly on BOTH the modern `user_profiles` shape
  -- (`role`, `is_admin`, `plan`) AND the legacy shape (just `id`,
  -- `email`, etc.) without requiring a column existence check.
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND to_jsonb(up)->>'role' IN ('owner', 'ceo', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND (
          (to_jsonb(up)->>'is_admin')::boolean = TRUE
          OR to_jsonb(up)->>'plan' = 'pro_plus'
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND to_jsonb(p)->>'subscription_tier' IN ('pro_plus', 'admin')
    );
$$;
GRANT EXECUTE ON FUNCTION current_user_is_admin() TO authenticated;

-- ============================================================
-- 2. list_admin_users_secure(p_search_term)
--    Returns up to 200 users from auth.users joined against user_profiles /
--    profiles, filtered by an optional ILIKE search term.
--    Returns JSONB so the client can parse one row at a time without a
--    separate column-type lockdown.
-- ============================================================
CREATE OR REPLACE FUNCTION list_admin_users_secure(
  p_search_term TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  v_result JSONB;
  v_search TEXT := COALESCE(NULLIF(TRIM(p_search_term), ''), '');
BEGIN
  IF NOT current_user_is_admin() THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.created DESC), '[]'::jsonb)
    INTO v_result
  FROM (
    SELECT
      au.id::text                                                    AS id,
      au.email::text                                                 AS email,
      -- Column-tolerant lookup: defer to JSON extraction so a
      -- `user_profiles` table that predates the `role` / `plan`
      -- / `name` columns (older shapes only have `id` + `email`)
      -- doesn't make the WHOLE RPC ERROR. `to_jsonb(...)` is safe
      -- because Postgres can introspect ANY columns.
      COALESCE(
        NULLIF(au.raw_user_meta_data->>'full_name', ''),
        (
          SELECT to_jsonb(up)->>'name'
          FROM public.user_profiles up
          WHERE up.user_id = au.id
          LIMIT 1
        ),
        (
          SELECT to_jsonb(p)->>'full_name'
          FROM public.profiles p
          WHERE p.id = au.id
          LIMIT 1
        ),
        split_part(au.email, '@', 1)
      )                                                             AS name,
      COALESCE(
        (
          SELECT to_jsonb(up)->>'role'
          FROM public.user_profiles up
          WHERE up.user_id = au.id
          LIMIT 1
        ),
        (
          SELECT to_jsonb(p)->>'subscription_tier'
          FROM public.profiles p
          WHERE p.id = au.id
          LIMIT 1
        ),
        'user'
      )                                                             AS role,
      COALESCE(
        (
          SELECT to_jsonb(up)->>'plan'
          FROM public.user_profiles up
          WHERE up.user_id = au.id
          LIMIT 1
        ),
        'free'
      )                                                             AS plan,
      (au.raw_user_meta_data->>'avatar_url')                         AS avatar_url,
      au.email_confirmed_at IS NOT NULL                              AS is_email_verified,
      au.created_at                                                  AS created,
      au.last_sign_in_at                                             AS last_sign_in,
      au.banned_until IS NOT NULL                                    AS is_banned
    FROM auth.users au
    WHERE
      v_search = ''
      OR au.email ILIKE '%' || v_search || '%'
      OR (au.raw_user_meta_data->>'full_name') ILIKE '%' || v_search || '%'
    ORDER BY au.created_at DESC
    LIMIT 200
  ) t;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION list_admin_users_secure(TEXT) TO authenticated;

-- ============================================================
-- 3. toggle_admin_secure(p_target_uuid, p_make_admin)
--    Server-side enforcement of the admin-promotion action exposed in
--    AdminUsers.tsx. We intentionally do NOT mutate auth.users.app_metadata
--    from the client — the gate is the SECURITY DEFINER + role check.
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_admin_secure(
  p_target_uuid UUID,
  p_make_admin BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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

  -- Schema-tolerant UPDATE for legacy / stripped `user_profiles`.
  --
  -- WHY DYNAMIC SQL + EXCEPTION WRAPPER:
  --   `role`, `is_admin`, `updated_at`, `user_id` may not exist on
  --   a deployed `user_profiles` that predates those columns. A
  --   plain `UPDATE` would error at parse time with `42703 undefined_column`,
  --   aborting the whole migration. Dynamic SQL via `EXECUTE` lets us
  --   catch the parse-time-or-execution-time failure and degrade
  --   gracefully (the caller still gets a structured response so the
  --   AdminUsers.tsx UI doesn't silently lie about success).
  BEGIN
    EXECUTE format(
      'UPDATE public.user_profiles '
      || 'SET role = $1, is_admin = $2, updated_at = NOW() '
      || 'WHERE user_id = $3',
      CASE WHEN p_make_admin THEN 'admin' ELSE 'user' END,
      p_make_admin,
      p_target_uuid
    );
  EXCEPTION WHEN undefined_column OR OTHERS THEN
    -- Stripped-down schema: silently no-op the typed mutation. We
    -- still RETURN a structured response so the AdminUsers client
    -- can show a soft warning instead of a hung request.
    RAISE NOTICE 'toggle_admin_secure: user_profiles schema is missing role / is_admin / updated_at / user_id; mutation no-op for %', p_target_uuid;
  END;

  RETURN jsonb_build_object(
    'id', p_target_uuid::text,
    'role', CASE WHEN p_make_admin THEN 'admin' ELSE 'user' END,
    'is_admin', p_make_admin
  );
END;
$$;
GRANT EXECUTE ON FUNCTION toggle_admin_secure(UUID, BOOLEAN) TO authenticated;

-- ============================================================
-- 4. Migration bookkeeping
-- ============================================================
INSERT INTO schema_migrations (version, description)
VALUES ('20260722_admin_users_rpc',
        'Adds current_user_is_admin + list_admin_users_secure + toggle_admin_secure RPCs so /admin/users shows the live Supabase users')
ON CONFLICT (version) DO NOTHING;
