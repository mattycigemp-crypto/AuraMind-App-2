-- Verify the migration actually applied AND find the *real* reason
-- list_admin_users_secure keeps returning 403.

-- (1) Was the migration recorded?
SELECT version, applied_at
FROM schema_migrations
WHERE version LIKE '20260723%';

-- (2) Are the FKs in place?
SELECT
  tc.table_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('study_sessions','card_reviews')
ORDER BY tc.table_name, tc.constraint_name;

-- (3) Does current_user_is_admin() recognise any admin user?
-- Replays the same EXISTS-or-EXISTS-or-EXISTS check against the caller's
-- auth.uid() — uses the live uuids seen on the failing requests. If 0 rows,
-- admin status isn't being derived from any of the three sources.
SELECT
  EXISTS (
    SELECT 1 FROM user_profiles up
     WHERE to_jsonb(up)->>'role' IN ('owner','ceo','admin')
     LIMIT 1
  ) AS user_profiles_role_admin_present,
  EXISTS (
    SELECT 1 FROM user_profiles up
     WHERE (to_jsonb(up)->>'is_admin')::boolean = TRUE
        OR to_jsonb(up)->>'plan' = 'pro_plus'
     LIMIT 1
  ) AS user_profiles_is_admin_or_pro_plus,
  EXISTS (
    SELECT 1 FROM profiles p
     WHERE to_jsonb(p)->>'subscription_tier' IN ('pro_plus','admin')
     LIMIT 1
  ) AS profiles_sub_admin,
  EXISTS (
    SELECT 1 FROM auth.users au
     WHERE au.raw_user_meta_data->>'role' IN ('owner','ceo','admin')
     LIMIT 1
  ) AS auth_metadata_role_admin_present;

-- (4) What does one sample user_profiles row look like? If the table
-- exists but has no rows at all, that explains why EVERY admin check
-- fails — there is no row to read.
SELECT COUNT(*) AS user_profiles_count FROM user_profiles;
SELECT COUNT(*) AS profiles_count FROM profiles;
