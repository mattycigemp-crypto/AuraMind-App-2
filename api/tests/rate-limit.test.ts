import { describe, it, expect } from 'vitest';
import handler from '../index.js';
import type { VercelResponse } from '@vercel/node';

/**
 * Regression cover for the middleware guard.
 *
 * `applyMiddleware` is async. It was once called without `await`, so the
 * guard tested `!Promise` — always false — and every request sailed past
 * the limiter into its handler. Two things hid it:
 *
 *   1. `tests/helpers.ts` hands each request a fresh IP, so no bucket
 *      ever filled up.
 *   2. Asserting only on the FINAL status still passes, because the
 *      limiter's late `res.status(429)` overwrites whatever the handler
 *      already wrote. On Vercel that second write lands after the response
 *      is already committed, so the caller really receives the handler's
 *      result — the request was never actually refused.
 *
 * So these tests reuse one IP and record EVERY status write. A correctly
 * gated request writes exactly one status; the bug writes two.
 */

function recordingRes(): VercelResponse & { writes: number[] } {
  const writes: number[] = [];
  const res: any = {
    writes,
    status(c: number) { writes.push(c); return res; },
    setHeader() { return res; },
    send() { return res; },
    json() { return res; },
    end() { return res; },
  };
  return res;
}

async function hit(path: string, ip: string) {
  const res = recordingRes();
  const req: any = {
    method: 'GET',
    query: { path },
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: undefined,
    socket: { remoteAddress: ip },
    url: `/api/${path}`,
  };
  await handler(req, res);
  return res.writes;
}

// An unrouted path exercises the middleware without any handler side
// effects: it falls through the switch to a plain 404.
const UNROUTED = 'definitely-not-an-endpoint';

describe('API rate limiting', () => {
  it('refuses the request instead of letting it reach the handler', async () => {
    const ip = '203.0.113.10';

    // The default bucket allows 100/min, so the 101st must be refused.
    let refused: number[] | null = null;
    for (let i = 0; i < 101; i++) {
      const writes = await hit(UNROUTED, ip);
      if (writes.includes(429)) { refused = writes; break; }
    }

    expect(refused, 'rate limiter never engaged for a repeated IP').not.toBeNull();

    // The whole point: a refused request must short-circuit. Seeing the
    // handler's 404 alongside the 429 means the guard did not stop it.
    expect(
      refused,
      'handler ran despite the rate limit — applyMiddleware is not being awaited',
    ).toEqual([429]);
  });

  it('keeps buckets separated per client IP', async () => {
    const noisy = '203.0.113.20';
    for (let i = 0; i < 101; i++) await hit(UNROUTED, noisy);

    const writes = await hit(UNROUTED, '203.0.113.21');
    expect(writes).not.toContain(429);
  });

  it('rate limits AI-spending endpoints harder than plain database ones', async () => {
    // `chat` bills an outbound model call per request, so it belongs in the
    // 30/min `ai` bucket rather than the 100/min `default` one.
    const ip = '203.0.113.30';
    let refusedAt = -1;

    for (let i = 1; i <= 40; i++) {
      const writes = await hit('chat', ip);
      if (writes.includes(429)) { refusedAt = i; break; }
    }

    expect(refusedAt, 'chat was never rate limited').toBeGreaterThan(0);
    expect(
      refusedAt,
      `chat should use the 30/min ai bucket, but survived ${refusedAt - 1} requests`,
    ).toBeLessThanOrEqual(31);
  });
});
