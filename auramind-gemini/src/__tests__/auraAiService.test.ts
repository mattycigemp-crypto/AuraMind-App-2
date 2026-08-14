import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest';

// The module builds its singleton at import time and THROWS when
// VITE_GROQ_API_KEY is absent, so the key must be stubbed before the
// dynamic import below. Previously this file imported the module at the
// top level and made live calls to api.groq.com — that made the suite
// depend on a real key and on network reachability.
vi.stubEnv('VITE_GROQ_API_KEY', 'test-key-not-real');
vi.stubEnv('VITE_USE_LOCAL_AI', 'false');

type AuraAiModule = typeof import('../services/api/auraAiService');
let mod: AuraAiModule;

beforeAll(async () => {
  mod = await import('../services/api/auraAiService');
});

/** Minimal OpenAI-shaped success payload. */
const okBody = (content: string) => ({
  id: 'chatcmpl-test',
  object: 'chat.completion',
  created: 1,
  model: 'llama-3.3-70b-versatile',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
});

const mockFetchOnce = (body: unknown, status = 200) => {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('auraAiService', () => {
  it('exposes the expected client surface', () => {
    expect(mod.auraAiClient).toBeDefined();
    expect(typeof mod.auraAiClient.ask).toBe('function');
    expect(typeof mod.auraAiClient.chatCompletion).toBe('function');
  });

  it('chatCompletion returns a parsed assistant message', async () => {
    mockFetchOnce(okBody('Hello'));

    const response = await mod.auraAiClient.chatCompletion(
      {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello in one word.' },
        ],
        temperature: 0.1,
        max_tokens: 10,
      },
      false, // bypass the response cache so the assertion is deterministic
    );

    expect(response.choices).toHaveLength(1);
    expect(response.choices[0].message.content).toBe('Hello');
    expect(response.choices[0].message.role).toBe('assistant');
  });

  it('chatCompletion posts to the Groq chat-completions endpoint', async () => {
    const fetchMock = mockFetchOnce(okBody('ok'));

    await mod.auraAiClient.chatCompletion(
      { messages: [{ role: 'user', content: 'ping' }] },
      false,
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(init.method).toBe('POST');
    // Assert the shape only. Vite inlines import.meta.env.VITE_* at
    // transform time, so the real .env key wins over vi.stubEnv here and
    // the concrete value differs between local and CI.
    expect(init.headers.Authorization).toMatch(/^Bearer .+/);
  });

  it('chatCompletion surfaces a GroqUnavailableError on 401', async () => {
    mockFetchOnce({ error: { message: 'Invalid API Key' } }, 401);

    await expect(
      mod.auraAiClient.chatCompletion(
        { messages: [{ role: 'user', content: 'unauthorized' }] },
        false,
      ),
    ).rejects.toThrow(/401|API key/i);
  });

  it('ask returns model content on success', async () => {
    mockFetchOnce(okBody('4'));
    const reply = await mod.auraAiClient.ask('What is 2+2?');
    expect(typeof reply).toBe('string');
    expect(reply).toContain('4');
  });

  it('ask degrades to a fallback string instead of throwing when the API fails', async () => {
    mockFetchOnce({ error: { message: 'Invalid API Key' } }, 401);

    const reply = await mod.auraAiClient.ask('Explain recursion in one sentence.');
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
  });
});
