import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { call } from './helpers.js';

const supabase = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabase),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  supabase.auth.getUser.mockReset();
});

describe('POST /api/search', () => {
  it('rejects requests without an auth header', async () => {
    const { status, body } = await call('search', {
      body: { query: 'mitochondria' },
    });
    expect(status).toBe(401);
    expect(body.error).toBe('Missing authorization');
  });

  it('rejects invalid tokens', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { status, body } = await call('search', {
      headers: { authorization: 'Bearer bad-token' },
      body: { query: 'mitochondria' },
    });
    expect(status).toBe(401);
    expect(body.error).toBe('Invalid token');
  });

  it('proxies results without leaking the API key', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.c' } },
      error: null,
    });

    let upstreamUrl = '';
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      upstreamUrl = String(url);
      return {
        ok: true,
        json: async () => ({
          items: [
            {
              title: 'Mitochondria - Wikipedia',
              link: 'https://en.wikipedia.org/wiki/Mitochondrion',
              snippet: 'A mitochondrion is an organelle.',
              displayLink: 'en.wikipedia.org',
            },
          ],
        }),
      };
    }));

    const { status, body } = await call('search', {
      headers: { authorization: 'Bearer good-token' },
      body: { query: 'mitochondria', maxResults: 5 },
    });

    expect(status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].title).toBe('Mitochondria - Wikipedia');
    // The server-side key must never appear in the response or the upstream URL sent to the client
    expect(JSON.stringify(body)).not.toContain('test-search-key');
    expect(upstreamUrl).toContain('key=test-search-key');
    expect(upstreamUrl).toContain('cx=test-engine-id');
  });

  it('returns 503 when search is not configured server-side', async () => {
    const savedKey = process.env.GOOGLE_SEARCH_API_KEY;
    const savedEngine = process.env.GOOGLE_SEARCH_ENGINE_ID;
    delete process.env.GOOGLE_SEARCH_API_KEY;
    delete process.env.GOOGLE_SEARCH_ENGINE_ID;
    try {
      const { status, body } = await call('search', {
        body: { query: 'x' },
      });
      expect(status).toBe(503);
      expect(body.error).toContain('not configured');
    } finally {
      if (savedKey) process.env.GOOGLE_SEARCH_API_KEY = savedKey;
      if (savedEngine) process.env.GOOGLE_SEARCH_ENGINE_ID = savedEngine;
    }
  });

  it('returns 502 on upstream Google errors', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.c' } },
      error: null,
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429, text: async () => 'rate limited' })));

    const { status, body } = await call('search', {
      headers: { authorization: 'Bearer good-token' },
      body: { query: 'mitochondria' },
    });
    expect(status).toBe(502);
    expect(body.error).toContain('429');
  });
});
