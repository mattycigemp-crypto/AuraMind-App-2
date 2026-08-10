/**
 * HTTP-path test for the Stripe webhook endpoint through the express server.
 * Side-effect free: only `ping` events (ignored by the handler) and bad signatures.
 *
 * Run:  cd api && npx tsx scripts/webhook-http-smoke.mjs
 */
import 'dotenv/config';
import Stripe from 'stripe';
import { spawn } from 'node:child_process';

const PORT = 3199;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const secret = process.env.STRIPE_WEBHOOK_SECRET;

const server = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(body, sig) {
  const headers = { 'content-type': 'application/json' };
  if (sig !== undefined) headers['stripe-signature'] = sig;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`http://localhost:${PORT}/api/stripe-webhook`, {
      method: 'POST',
      headers,
      body,
      signal: ctrl.signal,
    });
    return { status: res.status, body: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

let failures = 0;
const check = (label, actual, expected) => {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}  →  ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

try {
  // Wait for the server to come up
  let up = false;
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) { up = true; break; }
    } catch { /* not up yet */ }
    await wait(1000);
  }
  if (!up) throw new Error('server did not start');

  const payload = JSON.stringify({
    id: 'evt_test_ping_http', object: 'event', api_version: '2024-06-20',
    created: Math.floor(Date.now() / 1000), data: { object: {} },
    livemode: false, pending_webhooks: 0, request: null, type: 'ping',
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });

  let r = await post(payload, header);
  check('HTTP valid-sig ping', `${r.status} ${r.body}`, '200 {"received":true,"ignored":true}');

  r = await post(payload, 't=1,v1=deadbeef');
  check('HTTP bad-sig ping', r.status, 400);

  r = await post(payload);
  check('HTTP no-sig ping', r.status, 400);
} finally {
  server.kill();
}

console.log(failures === 0 ? '\nAll HTTP webhook tests passed.' : `\n${failures} test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
