#!/usr/bin/env node
/**
 * scripts/check-mobile-env.js
 *
 * Pre-flight check that runs before any mobile:* script (and is invoked at
 * the top of mobile:release:*). Verifies that all signing / API secrets are
 * actually set so the Gradle / fastlane commands downstream don't fail
 * mid-build with opaque errors.
 *
 * IMPORTANT: this script NEVER prints secret values. It just verifies
 * presence + plausible shape (length, prefix, file-exists).
 *
 * Exit codes:
 *   0 = all required vars present, all required binaries on PATH
 *   1 = required env vars are missing or malformed (callers can fix + retry)
 *   2 = required binary dependency is missing (callers need to install tooling)
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PROJECT_ROOT = path.resolve(__dirname, '..');

const checks = [];

// ── Android signing ────────────────────────────────────────────
checks.push({
  key: 'ANDROID_KEYSTORE_PATH',
  label: 'Android release keystore path',
  validate: (v) => {
    if (!v) return 'env var ANDROID_KEYSTORE_PATH is not set';
    const resolved = path.isAbsolute(v) ? v : path.resolve(REPO_ROOT, v);
    if (!fs.existsSync(resolved)) {
      return `keystore file not found at: ${resolved}`;
    }
    const stat = fs.statSync(resolved);
    if (stat.size < 1024) return `keystore suspiciously small: ${stat.size} bytes`;
    if (stat.size > 16 * 1024 * 1024) return `keystore suspiciously large: ${stat.size} bytes`;
    return null;
  },
});
checks.push({
  key: 'ANDROID_KEYSTORE_PASSWORD',
  label: 'Android keystore password',
  validate: (v) => (!v ? 'env var ANDROID_KEYSTORE_PASSWORD is not set' : null),
});
checks.push({
  key: 'ANDROID_KEY_ALIAS',
  label: 'Android key alias',
  validate: (v) => (!v ? 'env var ANDROID_KEY_ALIAS is not set' : null),
});
checks.push({
  key: 'ANDROID_KEY_PASSWORD',
  label: 'Android key password',
  validate: (v) => (!v ? 'env var ANDROID_KEY_PASSWORD is not set' : null),
});

// ── Google Play Console ────────────────────────────────────────
if (process.argv.includes('--with-play')) {
  checks.push({
    key: 'PLAY_STORE_SERVICE_ACCOUNT_JSON_PATH',
    label: 'Google Play service-account JSON',
    validate: (v) => {
      if (!v) return 'env var PLAY_STORE_SERVICE_ACCOUNT_JSON_PATH is not set';
      const resolved = path.isAbsolute(v) ? v : path.resolve(REPO_ROOT, v);
      if (!fs.existsSync(resolved)) return 'service-account JSON not found at: ' + resolved;
      const text = fs.readFileSync(resolved, 'utf8');
      if (!text.includes('"type": "service_account"')) {
        return 'service-account JSON does not look like a Google service account';
      }
      return null;
    },
  });
}

// ── Apple App Store Connect ─────────────────────────────────────
if (process.argv.includes('--with-asc')) {
  checks.push({
    key: 'APPLE_ID',
    label: 'Apple ID email (owner of App Store Connect)',
    validate: (v) => (!v || !v.includes('@') ? 'env var APPLE_ID is not set or not an email' : null),
  });
  checks.push({
    key: 'APPLE_TEAM_ID',
    label: 'Apple Developer Team ID (10 characters)',
    validate: (v) => (!v ? 'env var APPLE_TEAM_ID is not set' : v.length !== 10 ? `expected 10 chars, got ${v.length}` : null),
  });
  checks.push({
    key: 'ASC_API_KEY_PATH',
    label: 'App Store Connect API key (.p8 file)',
    validate: (v) => {
      if (!v) return 'env var ASC_API_KEY_PATH is not set';
      const resolved = path.isAbsolute(v) ? v : path.resolve(REPO_ROOT, v);
      if (!fs.existsSync(resolved)) return 'API key .p8 not found at: ' + resolved;
      return null;
    },
  });
}

// ── Optional: match cert-repo (when using fastlane match) ──────
if (process.argv.includes('--with-match')) {
  checks.push({
    key: 'MATCH_GIT_URL',
    label: 'fastlane match git repo URL',
    validate: (v) => (!v ? 'env var MATCH_GIT_URL is not set' : null),
  });
  checks.push({
    key: 'MATCH_PASSWORD',
    label: 'fastlane match encryption password',
    validate: (v) => (!v ? 'env var MATCH_PASSWORD is not set' : null),
  });
}

// ── System binaries ────────────────────────────────────────────
function ensureBinary(name) {
  const { execSync } = require('node:child_process');
  try {
    execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${name}`, { stdio: 'pipe' });
    return null;
  } catch {
    return `${name} not on PATH. ${process.platform === 'win32' ? `Install it and ensure it's reachable (e.g. 'where ${name}')` : 'Install the toolchain it belongs to'}.`;
  }
}

const binChecks = [];
if (process.argv.includes('--gradle')) {
  binChecks.push({ name: 'gradle', fix: 'bundle exec fastlane handles this — install Bundler + run `bundle install`' });
}
if (process.argv.includes('--xcodebuild')) {
  binChecks.push({ name: 'xcodebuild', fix: 'macOS only. Run on macOS or in CI.' });
}
if (process.argv.includes('--fastlane')) {
  binChecks.push({ name: 'bundle', fix: 'Install Ruby + Bundler; `gem install bundler`' });
  binChecks.push({ name: 'fastlane', fix: '`bundle exec fastlane` once Bundler is installed' });
}

// ── Run ─────────────────────────────────────────────────────────
let failed = 0;
let missingBinaries = 0;

console.log('\nAuraMind mobile release pre-flight check\n');

for (const c of checks) {
  const v = process.env[c.key];
  const err = c.validate ? c.validate(v) : null;
  if (err) {
    console.error(`  ✗ ${c.label} (${c.key})`);
    console.error(`      ${err}`);
    failed++;
  } else {
    console.log(`  ✓ ${c.label}`);
  }
}

for (const bc of binChecks) {
  const err = ensureBinary(bc.name);
  if (err) {
    console.error(`  ✗ ${bc.name}`);
    console.error(`      ${err}`);
    console.error(`      → ${bc.fix}`);
    missingBinaries++;
  } else {
    console.log(`  ✓ ${bc.name}`);
  }
}

if (missingBinaries > 0) {
  console.error(`\n${missingBinaries} binary dep${missingBinaries === 1 ? '' : 's'} missing. Install them and re-run.\n`);
  process.exit(2);
} else if (failed > 0) {
  console.error(`\n${failed} required item${failed === 1 ? '' : 's'} missing. Set them in your environment or in CI/CD secrets and try again.\n`);
  console.error('See auramind-gemini/android/keystore/README.md and store/ios/listing.md for what each var means.\n');
  process.exit(1);
} else {
  console.log('\nAll required items present.\n');
  process.exit(0);
}
