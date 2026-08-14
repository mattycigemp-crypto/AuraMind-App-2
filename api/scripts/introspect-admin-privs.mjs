#!/usr/bin/env node
/**
 * introspect-admin-privs — READ-ONLY follow-up to introspect-admin-schema.
 *
 * information_schema.role_table_grants only shows grants visible to the
 * current role, so an empty result for `authenticated` does NOT prove the
 * role lacks UPDATE. has_table_privilege() answers authoritatively.
 *
 * Also scopes the app_metadata backfill via the Auth Admin API, because
 * execute_sql runs as SECURITY INVOKER (20260809 hardening) and therefore
 * cannot read auth.users.
 *
 * Makes NO writes.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const sb = createClient(url, key, { auth: { persistSession: false } });

async function q(label, sql) {
  const { data, error } = await sb.rpc('execute_sql', { query_text: sql });
  console.log(`\n## ${label}`);
  console.log(error ? `  ERROR: ${error.message}` : JSON.stringify(data, null, 2));
  return data;
}

await q(
  'A. Authoritative privilege check (has_table_privilege)',
  `SELECT
     has_table_privilege('authenticated','public.user_profiles','UPDATE') AS auth_update,
     has_table_privilege('authenticated','public.user_profiles','SELECT') AS auth_select,
     has_table_privilege('authenticated','public.user_profiles','INSERT') AS auth_insert,
     has_table_privilege('anon','public.user_profiles','UPDATE')          AS anon_update`,
);

await q(
  'B. Column-level UPDATE on the sensitive columns',
  `SELECT
     has_column_privilege('authenticated','public.user_profiles','role','UPDATE')      AS can_update_role,
     has_column_privilege('authenticated','public.user_profiles','plan_tier','UPDATE') AS can_update_plan_tier`,
);

await q(
  'C. Confirm is_admin / plan columns are ABSENT (my migration assumed them)',
  `SELECT
     to_jsonb(up) ? 'is_admin' AS has_is_admin_col,
     to_jsonb(up) ? 'plan'     AS has_plan_col,
     to_jsonb(up) ? 'role'     AS has_role_col
   FROM public.user_profiles up LIMIT 1`,
);

await q(
  'D. Distinct role values currently in user_profiles',
  `SELECT COALESCE(role,'<null>') AS role, count(*) AS n
     FROM public.user_profiles GROUP BY 1 ORDER BY n DESC`,
);

await q(
  'E. profiles.subscription_tier values (Branch 3 escalation surface)',
  `SELECT COALESCE(subscription_tier,'<null>') AS tier, count(*) AS n
     FROM public.profiles GROUP BY 1 ORDER BY n DESC`,
);

// ── Backfill scope via Auth Admin API (execute_sql cannot read auth.users) ──
console.log('\n## F. Backfill scope (Auth Admin API)');
const admins = [];
let page = 1;
let total = 0;
for (;;) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.log(`  ERROR: ${error.message}`); break; }
  const users = data?.users ?? [];
  total += users.length;
  for (const u of users) {
    const um = u.user_metadata || {};
    const am = u.app_metadata || {};
    const claimsAdmin =
      ['owner', 'ceo', 'admin'].includes(um.role) ||
      um.is_admin === true ||
      ['owner', 'ceo', 'admin'].includes(am.role) ||
      (ADMIN_EMAIL && u.email === ADMIN_EMAIL);
    if (claimsAdmin) {
      admins.push({
        id: u.id,
        email: u.email,
        user_meta_role: um.role ?? null,
        user_meta_is_admin: um.is_admin ?? null,
        app_meta_role: am.role ?? null,
        is_admin_email: Boolean(ADMIN_EMAIL && u.email === ADMIN_EMAIL),
        needs_backfill:
          !['owner', 'ceo', 'admin'].includes(am.role) &&
          (['owner', 'ceo', 'admin'].includes(um.role) || um.is_admin === true),
      });
    }
  }
  if (users.length < 1000) break;
  page++;
}
console.log(`  total users: ${total}`);
console.log(`  admin-claiming users: ${admins.length}`);
console.log(JSON.stringify(admins, null, 2));
console.log(`\n  NEEDS BACKFILL: ${admins.filter((a) => a.needs_backfill).length}`);
console.log('\nDone — no writes performed.');
