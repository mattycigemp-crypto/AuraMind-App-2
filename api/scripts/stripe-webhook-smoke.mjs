/**
 * Stripe webhook signature smoke test — side-effect free.
 *
 * Verifies the webhook handler's signature plumbing WITHOUT triggering any
 * event processing that writes to the database or sends email:
 *   - uses only the `ping` event type (ignored by the handler, no side effects)
 *   - never calls Stripe's API
 *
 * Run:  cd api && npx tsx scripts/stripe-webhook-smoke.mjs
 */
import 'dotenv/config';
import Stripe from 'stripe';
import webhookHandler from '../stripe-webhook.js';

const secret = process.env.STRIPE_WEBHOOK_SECRET;
if (!secret) {
  console.error('STRIPE_WEBHOOK_SECRET not set — cannot run signature tests.');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function makeRes() {
  const state = { status: 200, body: null };
  return {
    state,
    status(c) { state.status = c; return this; },
    setHeader() { return this; },
    send(b) { state.body = b; return this; },
    json(b) { state.body = JSON.stringify(b); return this; },
  };
}

function pingEvent() {
  return {
    id: 'evt_test_ping',
    object: 'event',
    api_version: '2024-06-20',
    created: Math.floor(Date.now() / 1000),
    data: { object: {} },
    livemode: false,
    pending_webhooks: 0,
    request: null,
    type: 'ping',
  };
}

let failures = 0;
const check = (label, actual, expected) => {
  const pass = actual === expected;
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}  →  ${actual}${pass ? '' : ` (expected ${expected})`}`);
};

// --- Test 1: no signature header → rejected ---
{
  const res = makeRes();
  await webhookHandler({ method: 'POST', headers: {}, body: JSON.stringify(pingEvent()) }, res);
  check('T1 no signature header rejected', res.state.status, 400);
}

// --- Test 2: garbage signature → rejected (no DB writes) ---
{
  const res = makeRes();
  await webhookHandler(
    { method: 'POST', headers: { 'stripe-signature': 't=1,v1=deadbeef' }, body: JSON.stringify(pingEvent()) },
    res,
  );
  check('T2 invalid signature rejected', res.state.status, 400);
}

// --- Test 3: valid signature + raw string body → accepted, event ignored ---
{
  const payload = JSON.stringify(pingEvent());
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const res = makeRes();
  await webhookHandler(
    { method: 'POST', headers: { 'stripe-signature': header }, body: payload },
    res,
  );
  check('T3 valid sig (raw body) accepted', res.state.status, 200);
  check('T3 ping event ignored', res.state.body, JSON.stringify({ received: true, ignored: true }));
}

// --- Test 4: valid signature + parsed-object body (re-serialized, as the
//     express proxy would deliver it) → does constructEvent still pass? ---
{
  const payload = JSON.stringify(pingEvent());
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const res = makeRes();
  await webhookHandler(
    { method: 'POST', headers: { 'stripe-signature': header }, body: JSON.parse(payload) },
    res,
  );
  check('T4 valid sig (parsed body) accepted', res.state.status, 200);
  if (res.state.status !== 200) {
    console.log('    → re-serialized bodies break signature verification (express/self-hosted path)');
  }
}

// --- Test 5: non-POST method → 405 ---
{
  const res = makeRes();
  await webhookHandler({ method: 'GET', headers: {}, body: '' }, res);
  check('T5 GET rejected', res.state.status, 405);
}

console.log(failures === 0 ? '\nAll webhook signature tests passed.' : `\n${failures} test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
