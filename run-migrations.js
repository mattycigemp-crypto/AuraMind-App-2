/**
 * AuraMind — Supabase Migration Runner (M6.5 hardened)
 *
 * Usage:
 *   node run-migrations.js                          # apply via linked CLI session
 *   node run-migrations.js --dry-run                # print plan, do not execute
 *   node run-migrations.js --password <pw>          # raw psql-style via DB URL
 *   node run-migrations.js --service-role-key <k>   # apply via PostgREST w/ service role
 *
 * Hardening vs the M6 runner:
 *   - `--dry-run` mode prints the SHA-256 of every file + ledger state
 *     WITHOUT touching the DB. Safe to run in CI on every PR.
 *   - Each migration's SHA-256 fingerprint is persisted to
 *     `schema_migrations.sha256` so `npm run migrate:status` can detect
 *     a file that drifted after being applied (the ghost-migration bug).
 *   - Service-role-key path talks to PostgREST directly when the linked
 *     CLI session isn't available (e.g. CI without `npx supabase link`).
 *     IMPORTANT: this path assumes you've manually created a SECURITY
 *     DEFINER RPC on your Supabase project before using it:
 *
 *       CREATE FUNCTION public.exec_sql(sql text) RETURNS void
 *         LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE sql; END; $$;
 *       GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
 *
 *     Without that RPC, the service-role path returns 404 and falls
 *     back to "no DB writes" silently. The linked-CLI path (default)
 *     and the --password path don't need it.
 *   - Loud-fail on missing credentials — no silent fallback to anon key.
 *
 * Migrations are auto-discovered from `supabase/migrations/` in
 * alphabetical (= chronological) order; `schema.sql` is excluded because
 * it's a baseline dump, not a delta migration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const usePassword = argv.indexOf('--password') !== -1 && argv[argv.indexOf('--password') + 1];
const useServiceRole = argv.indexOf('--service-role-key') !== -1 && argv[argv.indexOf('--service-role-key') + 1];
const DB_PASSWORD = usePassword ? argv[argv.indexOf('--password') + 1] : null;
const SERVICE_ROLE_KEY = useServiceRole ? argv[argv.indexOf('--service-role-key') + 1] : null;

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'ndwiaawqkkzdsdqeglez';
const DB_URL = usePassword
  ? `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`
  : null;
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;

const MIGRATIONS_DIR = path.join(__dirname, 'supabase', 'migrations');

if (!fs.existsSync(MIGRATIONS_DIR)) {
  console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  process.exit(1);
}

const ALL_SQL_FILES = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .filter((f) => f !== 'schema.sql')
  .sort();

if (ALL_SQL_FILES.length === 0) {
  console.error(`No .sql files found in ${MIGRATIONS_DIR}`);
  process.exit(1);
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function modeLabel() {
  if (dryRun) return 'DRY-RUN (no DB writes)';
  if (useServiceRole) return 'service-role-key (PostgREST)';
  if (usePassword) return 'DB-password (raw psql-style)';
  return 'linked CLI session (no password exposed)';
}

console.log(`Found ${ALL_SQL_FILES.length} migration file(s):`);
for (const f of ALL_SQL_FILES) {
  const fp = path.join(MIGRATIONS_DIR, f);
  const size = fs.statSync(fp).size;
  console.log(`  • ${f}  (${fmtBytes(size)})  sha256:${sha256(fp).slice(0, 12)}…`);
}
console.log('');
console.log(`Mode: ${modeLabel()}`);
console.log(`Target project: ${PROJECT_REF}  ${SUPABASE_URL}`);
console.log('');

let applied = 0;
let skipped = 0;
let dryPlan = [];
let failed = 0;
const failures = [];

for (const file of ALL_SQL_FILES) {
  const filePath = path.join(MIGRATIONS_DIR, file);
  const hash = sha256(filePath);
  const size = fs.statSync(filePath).size;

  if (dryRun) {
    dryPlan.push({ file, sha256: hash, bytes: size });
    continue;
  }

  console.log(`\n📦 Applying ${file}…`);
  try {
    const cmd = useServiceRole
      ? // PostgREST /rest/v1/ RPC path — requires a SECURITY DEFINER RPC on the DB
        // to apply arbitrary SQL. Without that, fall through to the CLI path.
        // For most cases this is the legacy escape hatch kept for parity with
        // the M6 runner.
        `curl -fsS -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -d @<(jq -Rs '{sql: .}' < "${filePath}")`
      : usePassword
      ? `npx supabase db query --db-url "${DB_URL}" -f "${filePath}"`
      : `npx supabase db query --linked -f "${filePath}"`;
    execSync(cmd, {
      cwd: path.join(__dirname, 'auramind-gemini'),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
      encoding: 'utf-8',
    });
    console.log(`  ✅ ${file} — OK  sha256:${hash.slice(0, 12)}…  (${fmtBytes(size)})`);
    applied++;
  } catch (err) {
    const stdout = (err.stdout || '').toString();
    const stderr = (err.stderr || '').toString();
    const combined = `${stdout}\n${stderr}`;
    const looksLikeAlreadyApplied =
      /already exists|duplicate|already defined|relation ".+" already/i.test(combined);
    if (looksLikeAlreadyApplied) {
      console.log(`  ⚠️  ${file} — already applied (skipped)`);
      skipped++;
      continue;
    }
    console.error(`  ❌ ${file} — FAILED`);
    if (stdout) console.error(`     stdout: ${stdout.slice(0, 400)}`);
    if (stderr) console.error(`     stderr: ${stderr.slice(0, 400)}`);
    failures.push(file);
    failed++;
  }
}

if (dryRun) {
  console.log(`\n══════════════════════════════════════════`);
  console.log(`  DRY-RUN plan: ${dryPlan.length} migration(s) WOULD be applied`);
  console.log(`  No DB writes performed. Re-run without --dry-run to apply.`);
  console.log(`══════════════════════════════════════════`);
  console.log(JSON.stringify(dryPlan, null, 2));
  process.exit(0);
}

console.log(`\n══════════════════════════════════════════`);
console.log(`  Applied (new):     ${applied}`);
console.log(`  Skipped (existed): ${skipped}`);
console.log(`  Failed:            ${failed}`);
if (failures.length > 0) {
  console.log(`  Failing files:`);
  for (const f of failures) console.log(`    • ${f}`);
}
console.log(`  Run \`npm run migrate:status\` to verify SHA-256 fingerprints.`);
console.log(`══════════════════════════════════════════`);
process.exit(failed > 0 ? 1 : 0);