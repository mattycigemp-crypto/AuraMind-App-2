#!/usr/bin/env node
/**
 * AuraMind — Postinstall Dependency Audit
 *
 * Runs automatically after `npm install` (via the `postinstall` script in
 * package.json) and verifies that every critical optional dependency
 * actually resolved on disk. Vite's dev server returns 500 on a bare
 * specifier it can't resolve, which cascades into opaque "Failed to fetch
 * dynamically imported module" errors at the page level — this audit
 * catches the root cause BEFORE the user sees a broken dev server.
 *
 * Critical optional deps (won't break `npm install` if missing, but
 * MUST be present for the app to mount):
 *   - @heyputer/puter.js   — runtime AI fallback (CSP-safe dynamic import)
 *   - @mlc-ai/web-llm      — local in-browser AI inference
 *   - @supabase/supabase-js — backend
 *   - @radix-ui/*          — design-system primitives
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — at least one critical dep is missing (also prints remediation)
 *
 * Usage:
 *   node scripts/postinstall-audit.js
 *   node scripts/postinstall-audit.js --strict   # also fail on dev-only deps
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const strict = args.includes('--strict');

/**
 * @typedef {Object} DepCheck
 * @property {string} name — package name
 * @property {string} [subpath] — optional subpath to verify (e.g. 'dist/index.js')
 * @property {string} [why] — human-readable description for the audit log
 * @property {'critical' | 'dev'} tier — 'critical' fails the audit; 'dev' only fails with --strict
 */

// List curated from real "Failed to fetch dynamically imported module"
// console errors the user pasted in the dev session. Each one maps to a
// real optional dep that's required at runtime even though npm install
// happily succeeds without them.
const DEPS = [
  { name: '@heyputer/puter.js', why: 'Free AI fallback provider', tier: 'critical' },
  { name: '@mlc-ai/web-llm', why: 'In-browser local AI inference', tier: 'critical' },
  { name: '@supabase/supabase-js', why: 'Backend + auth + realtime', tier: 'critical' },
  { name: '@radix-ui/react-dropdown-menu', why: 'Dropdown primitives', tier: 'critical' },
  { name: '@radix-ui/react-toast', why: 'Toast primitives', tier: 'critical' },
  { name: '@radix-ui/react-select', why: 'Select primitives (replaces native <select>)', tier: 'critical' },
  { name: '@react-three/fiber', why: 'AuroraField WebGL background', tier: 'critical' },
  { name: 'three', why: 'AuroraField WebGL renderer', tier: 'critical' },
  { name: 'framer-motion', why: 'All glass-orb animations', tier: 'critical' },
  { name: 'sonner', why: 'Toast container (used by all services)', tier: 'critical' },
  // Dev-only — only fails with --strict
  { name: 'typescript', why: 'type-check', tier: 'dev' },
  { name: 'vite', why: 'dev server + build', tier: 'dev' },
  { name: '@vitejs/plugin-react', why: 'React refresh', tier: 'dev' },
];

/**
 * Verify a single package by checking node_modules/<name>/package.json
 * exists. We don't `require()` it because (a) it may be ESM-only,
 * (b) we don't want side effects, and (c) the package.json presence
 * is enough proof npm actually placed it on disk.
 */
function checkDep(dep) {
  const pkgJsonPath = path.join(ROOT, 'node_modules', dep.name, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    return { ...dep, ok: false, reason: 'not found in node_modules' };
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    return { ...dep, ok: true, version: pkg.version };
  } catch (e) {
    return { ...dep, ok: false, reason: 'package.json unreadable: ' + e.message };
  }
}

function main() {
  console.log('[AuraMind] Postinstall dependency audit');
  console.log(`  Strict mode: ${strict ? 'on (also fails on dev-only)' : 'off'}`);
  console.log('');

  const results = DEPS.map(checkDep);
  const failedCritical = results.filter(r => !r.ok && r.tier === 'critical');
  const failedDev = results.filter(r => !r.ok && r.tier === 'dev');

  // Print every result, grouped by tier.
  for (const tier of ['critical', 'dev']) {
    const tierResults = results.filter(r => r.tier === tier);
    if (tierResults.length === 0) continue;
    console.log(`  ${tier === 'critical' ? '🔴 CRITICAL' : '🟡 DEV'}`);
    for (const r of tierResults) {
      const marker = r.ok ? '✓' : '✗';
      const version = r.ok ? `@ ${r.version}` : '';
      console.log(`    ${marker} ${r.name}${version.padStart(2)} — ${r.why}${r.ok ? '' : ' (' + r.reason + ')'}`);
    }
    console.log('');
  }

  if (failedCritical.length > 0) {
    console.error('[AuraMind] Postinstall audit FAILED. Critical deps missing:');
    for (const r of failedCritical) console.error(`  - ${r.name}: ${r.reason}`);
    console.error('');
    console.error('Remediation:');
    console.error('  npm install --force    # clear cache + reinstall');
    console.error('  npm install <name>     # install just the missing one');
    console.error('  rm -rf node_modules && npm install   # last resort');
    console.error('');
    console.error('Without these, Vite returns 500 on dynamic imports of the');
    console.error('affected modules and the dev server shows "Failed to fetch');
    console.error('dynamically imported module" for every page that needs them.');
    process.exit(1);
  }

  if (strict && failedDev.length > 0) {
    console.error('[AuraMind] Postinstall audit (strict) FAILED. Dev-only deps missing:');
    for (const r of failedDev) console.error(`  - ${r.name}: ${r.reason}`);
    process.exit(1);
  }

  console.log(`[AuraMind] Postinstall audit passed (${results.filter(r => r.ok).length}/${results.length} deps present).`);
  process.exit(0);
}

main();