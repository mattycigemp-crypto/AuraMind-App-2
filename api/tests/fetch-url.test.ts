import { describe, it, expect, vi, afterEach } from 'vitest';
import { call } from './helpers.js';

const html = `<!DOCTYPE html>
<html><head><title>Example Domain</title></head>
<body><h1>Example Domain</h1><p>Hello <b>world</b>.</p>
<script>var x = 1;</script>
<style>body { color: red; }</style></body></html>`;

afterEach(() => vi.unstubAllGlobals());

describe('POST /api/fetch-url', () => {
  it('extracts title and text from a URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => html,
    })));

    const { status, body } = await call('fetch-url', {
      body: { url: 'https://example.com' },
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Example Domain');
    expect(body.data.text).toContain('Hello world');
    expect(body.data.text).not.toContain('script');
    expect(body.data.text).not.toContain('<b>');
    expect(body.data.url).toBe('https://example.com');
  });

  it('rejects a non-URL body with 400', async () => {
    const { status, body } = await call('fetch-url', { body: { url: 'not-a-url' } });
    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 502 when the upstream fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('getaddrinfo ENOTFOUND');
    }));

    const { status, body } = await call('fetch-url', {
      body: { url: 'https://example.com' },
    });
    expect(status).toBe(502);
    expect(body.error).toContain('getaddrinfo');
  });

  it('returns 502 on a non-2xx upstream response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })));

    const { status, body } = await call('fetch-url', {
      body: { url: 'https://example.com/missing' },
    });
    expect(status).toBe(502);
    expect(body.error).toContain('404');
  });
});
