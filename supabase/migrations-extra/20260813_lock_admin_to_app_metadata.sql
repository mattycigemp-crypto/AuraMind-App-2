-- AuraMind Database Migration: Lock admin authorization to app_metadata
-- Date: 2026-08-13
-- Version: 3.9.0
--
-- PROBLEM: current_user_is_admin() (from 20260723) reads four sources of
-- admin status, ALL of which are user-writable:
--   Branch 1: user_profiles.role            -> client UPDATE RLS, no column restriction
--   Branch 2: user_profiles.is_admin/plan   -> ditto (columns do not exist; branch is dead)
--   Branch 3: profiles.subscription_tier    -> client UPDATE RLS
--   Branch 4: auth.users.raw_user_meta_data -> auth.updateUser() from the browser
--
-- Verified against production before writing this migration:
--   * authenticated AND anon both hold table-level UPDATE on user_profiles
--     (has_table_privilege = true for both), and column-level UPDATE on
--     `role`. The RLS policy "Users can update own profile" has
--     USING (auth.uid() = user_id) and NO WITH CHECK, so a user can set
--     their own role to 'owner' and pass Branch 1.
--   * user_profiles has columns: role, plan_tier. It has NO is_admin and
--     NO plan column, so Branch 2 could never fire. An earlier draft of
--     this migration referenced those columns directly and would have
--     failed with "column does not exist".
--   * Both existing admins had role only in user_metadata; they were
--     backfilled into app_metadata by
--     api/scripts/backfill-admin-app-metadata.mjs BEFORE this migration.
--
-- FIX (three parts):
--   A. current_user_is_admin() reads ONLY the app_metadata claim in the JWT.
--      app_metadata cannot be written by the client SDK, only by the
--      service-role key (i.e. our API).
--   B. Revoke UPDATE on the `role` column from authenticated/anon, and
--      re-grant UPDATE on exactly the columns a user legitimately owns.
--      Postgres has no per-column RLS, so column privileges are the
--      correct mechanism -- WITH CHECK cannot compare OLD vs NEW.
--   C. Add a WITH CHECK to the UPDATE policy so the row's owner cannot
--      change (defence in depth alongside the column grants).
--
-- The service_role bypasses both RLS and column grants, so the admin API
-- continues to manage roles normally.
--
-- Idempotent: CREATE OR REPLACE, DROP POLICY IF EXISTS, REVOKE/GRANT are
-- all safe to re-run.

BEGIN;

-- ── A. current_user_is_admin(): app_metadata only ───────────────────────
-- auth.jwt() returns the verified claims of the calling user. The
-- app_metadata claim is populated by GoTrue from raw_app_meta_data, which
-- is writable only with the service-role key.

CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'ceo', 'admin'),
    FALSE
  );
$$;

GRANT EXECUTE ON FUNCTION current_user_is_admin() TO authenticated;

COMMENT ON FUNCTION current_user_is_admin() IS
  'Admin check. Reads ONLY app_metadata.role from the verified JWT: '
  'user_metadata and public table columns are client-writable and must '
  'never be trusted for authorization. Roles are written by the '
  'service-role API (api/index.ts).';

-- ── B. Column-level privileges on user_profiles ─────────────────────────
-- Remove blanket UPDATE, then re-grant only the columns a user owns.
-- `role` is deliberately excluded. anon has no business updating profiles
-- at all.

REVOKE UPDATE ON public.user_profiles FROM authenticated;
REVOKE UPDATE ON public.user_profiles FROM anon;
REVOKE INSERT ON public.user_profiles FROM anon;

GRANT UPDATE (
  full_name,
  theme_preference,
  study_preferences,
  last_active,
  streak,
  streak_days,
  last_study_date,
  xp,
  level,
  cards_studied,
  decks_created,
  sessions_completed,
  title,
  email
) ON public.user_profiles TO authenticated;

-- Note: plan_tier is intentionally NOT granted. Plan changes must flow
-- through the Stripe webhook (service-role), not the browser.

-- ── C. WITH CHECK on the UPDATE policy ──────────────────────────────────
-- USING alone gates which rows are visible to the UPDATE; WITH CHECK gates
-- what the row may become. Without it a user could reassign user_id.

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bookkeeping
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260813_lock_admin_to_app_metadata',
  'current_user_is_admin() now reads only app_metadata.role from the JWT. Revokes UPDATE on user_profiles.role/plan_tier from authenticated (column-level grants) and adds WITH CHECK to the self-update policy. Closes three admin privilege-escalation paths.'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
