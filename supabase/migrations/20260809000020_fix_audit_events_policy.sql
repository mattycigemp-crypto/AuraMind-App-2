-- Security: fix the audit_events SELECT policy.
--
-- The previous policy trusted `auth.users.raw_user_meta_data->>'is_admin'`,
-- which any signed-in user can write via auth.updateUser(). A user could set
-- user_metadata.is_admin = true and read the entire audit_events table
-- (admin actions, target emails, severity). Authorization must come from the
-- admin_roles table (is_admin/is_super_admin), matching every sibling admin
-- policy in this schema.

DROP POLICY IF EXISTS "Admins can read audit events" ON public.audit_events;

CREATE POLICY "Admins can read audit events"
  ON public.audit_events
  FOR SELECT
  USING (is_admin(auth.uid()));

-- ── Bookkeeping ─────────────────────────────────────────────────────────
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260809000020_fix_audit_events_policy',
  'Replace user_metadata.is_admin trust in the audit_events SELECT policy with the admin_roles-backed is_admin() check'
)
ON CONFLICT (version) DO NOTHING;
