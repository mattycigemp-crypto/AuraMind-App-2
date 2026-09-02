/**
 * Distributed rate limiting with a graceful local fallback.
 *
 * On Vercel, serverless instances are ephemeral — an in-memory Map only
 * limits per-instance, so effective limits scale with traffic. When
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are configured the
 * limiter uses Upstash's REST API (fixed-window INCR+EXPIRE, one round
 * trip) so limits hold across all instances. Without those env vars it
 * falls back to the in-process store so local dev keeps working.
 */

import type { VercelRequest } from '@vercel/node';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const distributedLimiterConfigured = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// In-process fallback store (also used as a circuit breaker when Upstash
// is unreachable — better per-instance limiting than failing open).
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: VercelRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function memoryHit(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, entry);
  }
  entry.count++;
  if (memoryStore.size > 10000) {
    const cutoff = now - windowMs;
    for (const [k, v] of memoryStore) {
      if (v.resetAt < cutoff) memoryStore.delete(k);
    }
  }
  return { allowed: entry.count <= max, remaining: Math.max(0, max - entry.count), resetAt: entry.resetAt };
}

async function upstashHit(key: string, max: number, windowSec: number): Promise<{ allowed: boolean; remaining: number; resetAt: number } | null> {
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSec), 'NX'],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: number | null }>;
    const count = typeof data?.[0]?.result === 'number' ? data[0].result : 1;
    // Reset aligns with the fixed window: worst case the key was created at
    // the start of this window, so now + window is an upper bound.
    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      resetAt: Date.now() + windowSec * 1000,
    };
  } catch {
    // Upstash unreachable — signal the caller to fall back to memory.
    return null;
  }
}

export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number; distributed: boolean }> {
  if (distributedLimiterConfigured) {
    const result = await upstashHit(`rz:rl:${key}`, max, Math.ceil(windowMs / 1000));
    if (result) return { ...result, distributed: true };
  }
  return { ...memoryHit(key, max, windowMs), distributed: false };
}
