#!/usr/bin/env node
/**
 * backfill-admin-app-metadata — copy admin roles from user_metadata into
 * app_metadata so existing admins keep access after
 * 20260813_lock_admin_to_app_metadata.sql narrows the trust boundary.
 *
 * MUST RUN BEFORE THE MIGRATION. The migration makes app_metadata.role the
 * only source of admin truth; any admin whose role lives solely in
 * user_metadata is locked out the moment it applies.
 *
 * Dry-run by default. Pass --apply to write.
 *
 *   node scripts/backfill-admin-app-metadata.mjs           # preview
 *   node scripts/backfill-admin-app-metadata.mjs --apply   # write
 *
 * Idempotent: a user whose app_metadata.role already matches is skipped.
 * Only ever ADDS an app_metadata.role for a user who already demonstrably
 * held that role in user_metadata — it never invents or elevates a role.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const ADMIN_ROLES = ['owner', 'ceo', 'admin'];
const sb = createClient(url, key, { auth: { persistSession: false } });

console.log(`Admin app_metadata backfill — ${APPLY ? 'APPLY (writes)' : 'DRY RUN (no writes)'}`);
console.log(`Project: ${url.replace(/https:\/\/([a-z0-9]+)\..*/, '$1')}\n`);

// ── Collect ────────────────────────────────────────────────────────────
const targets = [];
let page = 1;
let total = 0;
for (;;) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error(`listUsers failed: ${error.message}`);
    process.exit(1);
  }
  const users = data?.users ?? [];
  total += users.length;
  for (const u of users) {
    const um = u.user_metadata || {};
    const am = u.app_metadata || {};

    // Derive the role this user already effectively holds.
    let derived = null;
    if (ADMIN_ROLES.includes(um.role)) derived = um.role;
    else if (um.is_admin === true) derived = 'admin';
    if (ADMIN_EMAIL && u.email === ADMIN_EMAIL) derived = 'owner';

    if (!derived) continue;
    if (am.role === derived) continue; // already correct — idempotent skip

    targets.push({ id: u.id, email: u.email, from: am.role ?? null, to: derived });
  }
  if (users.length < 1000) break;
  page++;
}

console.log(`Scanned ${total} users. ${targets.length} need backfill:\n`);
for (const t of targets) {
  console.log(`  ${t.email}`);
  console.log(`    app_metadata.role: ${t.from ?? '(none)'} -> ${t.to}`);
}

if (!targets.length) {
  console.log('\nNothing to do.');
  process.exit(0);
}

if (!APPLY) {
  console.log('\nDRY RUN — no writes performed. Re-run with --apply to write.');
  process.exit(0);
}

// ── Apply ──────────────────────────────────────────────────────────────
console.log('\nApplying...\n');
let ok = 0;
const failed = [];
for (const t of targets) {
  const { data: cur, error: readErr } = await sb.auth.admin.getUserById(t.id);
  if (readErr || !cur?.user) {
    failed.push({ email: t.email, error: readErr?.message || 'user vanished' });
    continue;
  }
  const { error } = await sb.auth.admin.updateUserById(t.id, {
    app_metadata: { ...(cur.user.app_metadata || {}), role: t.to },
  });
  if (error) {
    failed.push({ email: t.email, error: error.message });
    console.log(`  FAIL ${t.email}: ${error.message}`);
  } else {
    ok++;
    console.log(`  OK   ${t.email} -> app_metadata.role = ${t.to}`);
  }
}

console.log(`\n${ok} updated, ${failed.length} failed.`);

// ── Verify ─────────────────────────────────────────────────────────────
console.log('\nVerifying...');
let verified = 0;
for (const t of targets) {
  const { data } = await sb.auth.admin.getUserById(t.id);
  const actual = data?.user?.app_metadata?.role;
  const good = actual === t.to;
  if (good) verified++;
  console.log(`  ${good ? 'OK  ' : 'BAD '} ${t.email}: app_metadata.role = ${actual ?? '(none)'}`);
}
console.log(`\n${verified}/${targets.length} verified.`);
process.exit(failed.length ? 1 : 0);
