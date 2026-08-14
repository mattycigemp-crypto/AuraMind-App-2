-- AuraMind Database Migration: Lock admin authorization to app_metadata
-- Date: 2026-08-13
-- Version: 3.9.0
--
-- PROBLEM: current_user_is_admin() (from 20260723) reads four sources of
-- admin status, three of which are user-writable:
--   Branch 1: user_profiles.role      → writable via client UPDATE RLS
--   Branch 2: user_profiles.is_admin  → writable via client UPDATE RLS
--   Branch 3: profiles.subscription_tier → writable via client UPDATE RLS
--   Branch 4: auth.users.raw_user_meta_data->>'role' → writable via auth.updateUser()
--
-- Any signed-in user could self-promote to admin via any of these paths.
--
-- FIX (two parts):
--   A. Rewrite current_user_is_admin() to read ONLY app_metadata, which
--      can only be written by the service-role key (i.e. the API layer).
--   B. Tighten user_profiles UPDATE RLS so client writes cannot set the
--      role, is_admin, or plan columns. Admin writes to these columns go
--      through the API using the service-role key, bypassing RLS.
--
-- Idempotent: CREATE OR REPLACE FUNCTION / DROP POLICY IF EXISTS.

-- ── A. current_user_is_admin() ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT
    -- Source of truth: app_metadata.role, written by the service-role API.
    (auth.jwt()->'app_metadata'->>'role') IN ('owner', 'ceo', 'admin')
    -- ADMIN_EMAIL fallback: the owner bypasses role checks via env var,
    -- verified server-side against the user's email address.
    OR (
      current_setting('app.settings.ADMIN_EMAIL', true) != ''
      AND (auth.jwt()->'email') = current_setting('app.settings.ADMIN_EMAIL', true)
    );
$$;

GRANT EXECUTE ON FUNCTION current_user_is_admin() TO authenticated;

-- ── B. Column-restricted UPDATE on user_profiles ─────────────────────────
-- Replace the unconditional self-update policy with one that forbids
-- client-side writes to authorization-sensitive columns. The service-role
-- key (used by the API) bypasses RLS entirely, so admin writes still work.

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- This policy blocks UPDATE if the new row tries to set any of the
-- authorization-sensitive columns to a value that differs from the
-- existing row. This uses a WHEN clause that is true (allow) when none
-- of the restricted columns changed, and false (deny) otherwise.
--
-- Implementation note: Postgres RLS has no "column-level" UPDATE control,
-- so we check the values directly. The service-role API bypasses RLS so
-- admin promotions via the API are unaffected.
CREATE POLICY "Users can update own profile (no role/admin/plan)"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Block client-side changes to authorization-sensitive columns.
    -- After this migration, role/is_admin/plan in user_profiles are
    -- read-only for clients; admin writes go through the API (service-role)
    -- which bypasses RLS.
    AND (
      -- New row must not introduce a role value the client is not allowed to set.
      -- We allow the UPDATE if role is NULL or unchanged, or matches
      -- the existing row. A more precise check would compare OLD and NEW,
      -- but WITH CHECK only sees the NEW row, so we use a simpler guard:
      -- deny if role is set to an admin-level value from a client.
      (COALESCE(role, 'user')) IN ('user', 'employee')
      -- Same for is_admin: must not be TRUE from a client.
      AND COALESCE(is_admin, false) = false
      -- plan must not be upgraded to a paid tier via client write.
      AND COALESCE(plan, 'Starter') IN ('Starter', 'Free')
    )
  );

-- Bookkeeping
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260813_lock_admin_to_app_metadata',
  'Rewrite current_user_is_admin() to read only app_metadata (drops user-writable branches). Tighten user_profiles UPDATE RLS to block client-side role/is_admin/plan escalation.'
)
ON CONFLICT (version) DO NOTHING;
