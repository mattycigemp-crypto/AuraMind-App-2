#!/usr/bin/env node
/**
 * introspect-admin-schema — READ-ONLY inspection of the admin authz surface.
 *
 * Answers the questions that determine whether
 * 20260813_lock_admin_to_app_metadata.sql can be applied safely:
 *
 *   1. Does public.user_profiles actually have role / is_admin / plan columns?
 *      (20260722_admin_users_rpc.sql RAISE NOTICEs suggest it may not, which is
 *      why 20260723 used to_jsonb(up)->>'role' instead of up.role.)
 *   2. What is the full column list, so a column-level GRANT can be written?
 *   3. How many users carry an admin role in user_metadata that must be
 *      backfilled into app_metadata?
 *   4. What table-level privileges does `authenticated` currently hold?
 *
 * Makes NO writes. Every statement is a SELECT.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

async function q(label, sql) {
  const { data, error } = await sb.rpc('execute_sql', { query_text: sql });
  if (error) {
    console.log(`\n## ${label}\n  ERROR: ${error.message}`);
    return null;
  }
  console.log(`\n## ${label}`);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

console.log('READ-ONLY admin schema introspection');
console.log(`Project: ${url.replace(/https:\/\/([a-z]+)\..*/, '$1')}`);

await q(
  '1. user_profiles columns',
  `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_profiles'
    ORDER BY ordinal_position`,
);

await q(
  '2. Does profiles exist, and its columns',
  `SELECT column_name, data_type
     FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
    ORDER BY ordinal_position`,
);

await q(
  '3. Current RLS policies on user_profiles',
  `SELECT policyname, cmd, qual, with_check
     FROM pg_policies
    WHERE schemaname='public' AND tablename='user_profiles'`,
);

await q(
  '4. Table privileges held by authenticated/anon on user_profiles',
  `SELECT grantee, privilege_type
     FROM information_schema.role_table_grants
    WHERE table_schema='public' AND table_name='user_profiles'
      AND grantee IN ('authenticated','anon','service_role')
    ORDER BY grantee, privilege_type`,
);

await q(
  '5. Column-level grants already present on user_profiles',
  `SELECT grantee, column_name, privilege_type
     FROM information_schema.column_privileges
    WHERE table_schema='public' AND table_name='user_profiles'
      AND grantee IN ('authenticated','anon')
    ORDER BY grantee, column_name`,
);

await q(
  '6. Admin-role users: user_metadata vs app_metadata (BACKFILL SCOPE)',
  `SELECT
      id,
      email,
      raw_user_meta_data->>'role'  AS user_meta_role,
      raw_app_meta_data->>'role'   AS app_meta_role,
      (raw_user_meta_data->>'is_admin') AS user_meta_is_admin
     FROM auth.users
    WHERE raw_user_meta_data->>'role' IN ('owner','ceo','admin')
       OR (raw_user_meta_data->>'is_admin')::text = 'true'
       OR raw_app_meta_data->>'role' IN ('owner','ceo','admin')
    ORDER BY created_at`,
);

await q(
  '7. Total user count (blast radius)',
  `SELECT count(*) AS total_users FROM auth.users`,
);

await q(
  '8. Existing current_user_is_admin definition',
  `SELECT pg_get_functiondef(oid) AS def
     FROM pg_proc
    WHERE proname='current_user_is_admin'`,
);

await q(
  '9. schema_migrations applied versions (last 10)',
  `SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 10`,
);

console.log('\nDone — no writes performed.');
