-- AuraMind Database Migration: Admin auth-metadata fallback
-- Date: 2026-07-23
-- Version: 3.8.1
--
-- After 20260723100000_postgrest_reload_and_session_fks fired NOTIFY pgrst, the
-- list_admin_users_secure RPC *still* returned 403 from the live console.
-- Probe confirmed public.profiles is empty AND public.user_profiles is
-- not guaranteed to carry an admin row for every admin user. The root
-- cause: `current_user_is_admin()` checks `user_profiles.role` /
-- `user_profiles.is_admin` / `user_profiles.plan` / `profiles.
-- subscription_tier` — but the AuraMind admin-promotion path stores
-- role in auth metadata (`supabase.auth.updateUser({data:{role:...}})`),
-- not in the public tables. Legacy admin users therefore 403.
--
-- FIX: extend current_user_is_admin() with a fourth source-of-truth
-- branch — `auth.users.raw_user_meta_data->>'role' IN ('owner','ceo',
-- 'admin')`. This is additive (a real admin still passes via ANY of
-- the four branches; a non-admin still fails), so no security
-- regression. SECURITY DEFINER + stable is preserved; the function
-- continues to run with the migration-owner's (typically postgres)
-- privileges, which DO have SELECT on auth.users.
--
-- Why not just backfill user_profiles.role: the user_profiles table
-- carries unrelated study preferences (`study_preferences`, `joined_at`
-- etc.) that aren't easy to derive from auth metadata alone. Picking
-- admin status off the JWT-aligned source is more honest.
--
-- Idempotent: CREATE OR REPLACE FUNCTION on the same name.

CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT
    -- Branch 1: user_profiles.role is the canonical AuraMind role column.
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND to_jsonb(up)->>'role' IN ('owner', 'ceo', 'admin')
    )
    -- Branch 2: boolean / plan flags on user_profiles (legacy shapes).
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND (
          (to_jsonb(up)->>'is_admin')::boolean = TRUE
          OR to_jsonb(up)->>'plan' = 'pro_plus'
        )
    )
    -- Branch 3: profiles.subscription_tier (legacy billing shape).
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND to_jsonb(p)->>'subscription_tier' IN ('pro_plus', 'admin')
    )
    -- Branch 4 (NEW): auth.users.raw_user_meta_data->>'role'. This is
    -- where AuraMind's own admin-promotion flow writes role (via
    -- supabase.auth.updateUser) so legacy accounts get recognised.
    OR EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
        AND au.raw_user_meta_data->>'role' IN ('owner', 'ceo', 'admin')
    );
$$;
GRANT EXECUTE ON FUNCTION current_user_is_admin() TO authenticated;

-- Bookkeeping
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260723_admin_auth_metadata_fallback',
  'Adds auth.users.raw_user_meta_data role branch to current_user_is_admin() so legacy admin users (role in JWT, not in public tables) are recognised.'
)
ON CONFLICT (version) DO NOTHING;
