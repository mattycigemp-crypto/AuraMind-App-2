import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { call } from './helpers.js';

/**
 * The AI proxy tries each configured free-tier provider in turn. The point is
 * that a spent free quota degrades to a different free tier rather than an
 * outage, so these tests pin the failover decisions rather than the happy path:
 *
 *   - a 429 (quota spent) must advance to the next provider
 *   - a 400 (our own bad request) must NOT — it fails identically everywhere,
 *     and retrying would burn the remaining providers' quota for nothing
 *   - the endpoint must stay up when Groq specifically is unconfigured
 */

const supabase = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabase),
}));

const AUTHED = { headers: { authorization: 'Bearer good-token' } };

/** Minimal OpenAI-shaped success body. */
function okBody(text: string) {
  return {
    choices: [{ message: { role: 'assistant', content: text } }],
    usage: { completion_tokens: 7 },
  };
}

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

/** Record which upstream hosts were called, in order. */
function mockUpstreams(handlers: Array<{ status: number; body: unknown }>) {
  const calls: string[] = [];
  let i = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: any) => {
      calls.push(String(url));
      const h = handlers[Math.min(i, handlers.length - 1)];
      i++;
      return response(h.status, h.body);
    }),
  );
  return calls;
}

beforeEach(() => {
  supabase.auth.getUser.mockResolvedValue({
    // /api/ai now requires an entitled user, so the fixture carries one.
    data: { user: { id: 'u1', email: 'a@b.co', app_metadata: { subscription_status: 'active' } } },
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  supabase.auth.getUser.mockReset();
});

describe('AI provider failover', () => {
  it('returns 503 when no provider key is configured at all', async () => {
    vi.stubEnv('GROQ_API_KEY', '');
    vi.stubEnv('VITE_GROQ_API_KEY', '');
    vi.stubEnv('CEREBRAS_API_KEY', '');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('OPENROUTER_API_KEY', '');

    const { status } = await call('ai/chat', {
      ...AUTHED,
      body: { messages: [{ role: 'user', content: 'hi' }] },
    });
    expect(status).toBe(503);
  });

  it('stays up when Groq is unconfigured but another provider has a key', async () => {
    // Regression: the handler used to hard-gate on GROQ_API_KEY, which took
    // the whole endpoint down even with other free tiers available.
    vi.stubEnv('GROQ_API_KEY', '');
    vi.stubEnv('VITE_GROQ_API_KEY', '');
    vi.stubEnv('CEREBRAS_API_KEY', 'test-cerebras');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('OPENROUTER_API_KEY', '');

    const calls = mockUpstreams([{ status: 200, body: okBody('from cerebras') }]);

    const { status } = await call('ai/chat', {
      ...AUTHED,
      body: { messages: [{ role: 'user', content: 'hi' }] },
    });

    expect(status).toBe(200);
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain('cerebras.ai');
  });

  it('fails over to the next provider when the first returns 429', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-groq');
    vi.stubEnv('CEREBRAS_API_KEY', 'test-cerebras');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('OPENROUTER_API_KEY', '');

    const calls = mockUpstreams([
      { status: 429, body: { error: 'rate limit reached' } },
      { status: 200, body: okBody('served by the backup') },
    ]);

    const { status, body } = await call('ai/chat', {
      ...AUTHED,
      body: { messages: [{ role: 'user', content: 'hi' }] },
    });

    expect(status, 'a spent quota on one provider should not surface as an error').toBe(200);
    expect(calls.length, 'expected a second provider to be tried').toBe(2);
    expect(calls[0]).toContain('groq.com');
    expect(calls[1]).toContain('cerebras.ai');
    expect(body?.choices?.[0]?.message?.content).toBe('served by the backup');
  });

  it('does not fail over on 400 — a bad request fails the same everywhere', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-groq');
    vi.stubEnv('CEREBRAS_API_KEY', 'test-cerebras');
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini');
    vi.stubEnv('OPENROUTER_API_KEY', '');

    const calls = mockUpstreams([{ status: 400, body: { error: 'bad payload' } }]);

    const { status } = await call('ai/chat', {
      ...AUTHED,
      body: { messages: [{ role: 'user', content: 'hi' }] },
    });

    expect(status).toBe(400);
    expect(
      calls.length,
      'a 400 must not burn the other providers free quota',
    ).toBe(1);
  });

  it('surfaces the last status when every provider is exhausted', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-groq');
    vi.stubEnv('CEREBRAS_API_KEY', 'test-cerebras');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('OPENROUTER_API_KEY', '');

    const calls = mockUpstreams([
      { status: 429, body: { error: 'rate limited' } },
      { status: 429, body: { error: 'rate limited' } },
    ]);

    const { status } = await call('ai/chat', {
      ...AUTHED,
      body: { messages: [{ role: 'user', content: 'hi' }] },
    });

    // 429 reaches the client so it can show the "sign in with Puter" banner.
    expect(status).toBe(429);
    expect(calls.length).toBe(2);
  });
});
