import { describe, it, expect, vi, afterEach } from 'vitest';
import { call } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

const videoPage = `<html><head><title>Cool Video - YouTube</title></head><body></body></html>`;
const transcript = JSON.stringify([
  { text: 'Hello', duration: 1 },
  { text: 'world', duration: 1 },
  { text: 'this is a test', duration: 2 },
]);

describe('POST /api/fetch-youtube-transcript', () => {
  it('extracts a title and joins transcript segments', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => videoPage })
      .mockResolvedValueOnce({ ok: true, json: async () => JSON.parse(transcript) });
    vi.stubGlobal('fetch', fetchMock);

    const { status, body } = await call('fetch-youtube-transcript', {
      body: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Cool Video');
    expect(body.data.text).toBe('Hello world this is a test');
    expect(body.data.videoId).toBe('dQw4w9WgXcQ');
  });

  it('rejects a non-YouTube URL with 400', async () => {
    const { status, body } = await call('fetch-youtube-transcript', {
      body: { url: 'https://example.com' },
    });
    expect(status).toBe(400);
    expect(body.error).toBe('Invalid YouTube URL');
  });

  it('returns a graceful error field when the transcript is unavailable', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => videoPage })
      .mockResolvedValueOnce({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);

    const { status, body } = await call('fetch-youtube-transcript', {
      body: { url: 'youtu.be/abc123xyz00' },
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.text).toBe('');
    expect(body.data.error).toContain('Transcript not available');
  });
});
