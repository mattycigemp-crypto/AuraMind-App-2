#!/usr/bin/env node
/**
 * verify-launch — pre-launch gate check for AuraMind.
 *
 * Runs the checks from STRIPE_LAUNCH_CHECKLIST.md as a single command so a
 * misconfigured launch can't slip through silently:
 *
 *   1. Required API env present (Stripe key, webhook secret, Supabase).
 *   2. Required client env present (price IDs, Supabase anon key).
 *   3. Stripe mode alignment — every client price ID must be retrievable with
 *      the configured STRIPE_SECRET_KEY AND match its mode (live/test).
 *
 * Usage (from api/):
 *   node scripts/verify-launch.mjs
 *
 * Exit code 0 = all green, 1 = at least one gate failed (details printed).
 * Read-only: the only network call is Stripe prices.retrieve (GET), which
 * never mutates anything.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ENV_PATH = path.resolve(__dirname, '..', '..', 'auramind-gemini', '.env');

const failures = [];
const passes = [];

function check(ok, label, detail = '') {
  if (ok) passes.push(label);
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const api = process.env; // api/.env loaded by dotenv/config
const client = readEnvFile(CLIENT_ENV_PATH);

console.log('AuraMind pre-launch verification\n');

// ── 1. API env ─────────────────────────────────────────────────────────────
const secretKey = api.STRIPE_SECRET_KEY || '';
const webhookSecret = api.STRIPE_WEBHOOK_SECRET || '';
check(Boolean(secretKey), '[api] STRIPE_SECRET_KEY present');
check(Boolean(webhookSecret), '[api] STRIPE_WEBHOOK_SECRET present');
check(
  Boolean(api.SUPABASE_URL || api.VITE_SUPABASE_URL),
  '[api] SUPABASE_URL present',
);
check(Boolean(api.SUPABASE_SERVICE_ROLE_KEY), '[api] SUPABASE_SERVICE_ROLE_KEY present');

const isLiveKey = secretKey.startsWith('sk_live_');
const keyMode = isLiveKey ? 'LIVE' : secretKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN';
check(secretKey.startsWith('sk_live_') || secretKey.startsWith('sk_test_'),
  '[api] STRIPE_SECRET_KEY mode recognizable',
  `current mode: ${keyMode}${isLiveKey ? ' — ⚠️ live key active, be careful' : ''}`);

// ── 2. Client env ──────────────────────────────────────────────────────────
const priceIds = {
  monthly: client.VITE_STRIPE_PRICE_ID_MONTHLY || '',
  annual: client.VITE_STRIPE_PRICE_ID_ANNUAL || '',
};
const clientFilePath = path.relative(process.cwd(), CLIENT_ENV_PATH);
check(Boolean(client.VITE_SUPABASE_URL), '[client] VITE_SUPABASE_URL present');
check(Boolean(client.VITE_SUPABASE_ANON_KEY), '[client] VITE_SUPABASE_ANON_KEY present');
check(Boolean(priceIds.monthly), '[client] VITE_STRIPE_PRICE_ID_MONTHLY present', clientFilePath);
check(Boolean(priceIds.annual), '[client] VITE_STRIPE_PRICE_ID_ANNUAL present', clientFilePath);

// ── 3. Stripe mode alignment (network, read-only) ──────────────────────────
if (secretKey.startsWith('sk_') && (priceIds.monthly || priceIds.annual)) {
  const stripe = new Stripe(secretKey);
  for (const [label, priceId] of Object.entries(priceIds)) {
    if (!priceId) continue;
    try {
      const price = await stripe.prices.retrieve(priceId);
      const priceMode = price.livemode ? 'LIVE' : 'TEST';
      check(
        price.livemode === isLiveKey,
        `[stripe] ${label} price (${priceId.slice(0, 12)}…) mode matches key (${priceMode} vs ${keyMode})`,
        `retrieved OK — price is ${priceMode}`,
      );
    } catch (e) {
      check(
        false,
        `[stripe] ${label} price (${priceId.slice(0, 12)}…) retrievable with key`,
        `Stripe error: ${e?.message || e}`,
      );
    }
  }
} else {
  check(
    false,
    '[stripe] mode alignment check ran',
    'skipped — need a real key AND client price IDs (placeholders/empty values)',
  );
}

// ── Report ─────────────────────────────────────────────────────────────────
console.log(`PASS (${passes.length}):`);
passes.forEach((p) => console.log(`  ✅ ${p}`));
if (failures.length > 0) {
  console.log(`\nFAIL (${failures.length}):`);
  failures.forEach((f) => console.log(`  ❌ ${f}`));
  console.log('\nFix the failures above, then re-run. Full runbook: STRIPE_LAUNCH_CHECKLIST.md');
  process.exit(1);
} else {
  console.log('\nAll gates green. Ready to launch checkout.');
  process.exit(0);
}
