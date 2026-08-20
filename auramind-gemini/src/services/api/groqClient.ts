/**
 * groqClient — single source of truth for Groq chat completions in AuraMind.
 *
 * Replaces two previously-duplicated implementations:
 *   - nexusService.ts → private `callGroqAI(prompt)`
 *   - groqService.ts → `getDeepSeekClient().chat(messages, model?)`
 *
 * Both did the same fetch with subtly different defaults (max_tokens 500
 * vs 4000, no local-AI routing vs yes). Centralising so a future param
 * tweak (timeout, retry, response_format, model rotation) lands in
 * exactly one place.
 *
 * Design choices:
 *
 * 1. **Discriminated union on options** — callers MUST pass exactly one of
 *    `prompt` or `messages`. Passing both is a TypeScript error, not a
 *    silent overload. This replaces a defensive `if (prompt && messages)`
 *    branch that couldn't fire today but was bug-bait for future callers.
 *
 * 2. **Per-call env reads** — env reads happen inside `groqChat()`, not
 *    at module top-level. This is the only way `vi.stubEnv('VITE_GROQ_API_KEY', …)`
 *    works in vitest; module-load consts would capture the empty value
 *    on parse. Per-call cost is one proxy property lookup — negligible.
 *
 * 3. **Default maxTokens = 4000.** Pre-refactor Nexus used 500 — that cap
 *    caused `runAIAgent`'s 4-step research plan to truncate badly. groqService
 *    already used 4000. Unifying to 4000 fixes the truncation. Callers that
 *    expect short summaries (e.g. "2-3 sentences" prompts in fetchMarketIntel)
 *    can pass an explicit `maxTokens` override per call site if needed.
 *
 * 4. **Model name resolution is `override ?? env ?? 'llama-3.3-70b-versatile'`.**
 *    The fallback MUST be a Groq-supported model — `llama3-8b-8192` was
 *    deprecated in 2024 and now 400s. The hardcoded escape hatch is the
 *    safe default. NOTE: deliberately NOT reading `VITE_AI_MODEL` — that
 *    var can hold an OpenRouter-style name (e.g. `deepseek/deepseek-r1-0528:free`)
 *    that Groq rejects.
 *
 * Env vars (read per-call, so vitest stubEnv works):
 *   VITE_GROQ_API_KEY      — bearer token for api.groq.com
 *   VITE_USE_LOCAL_AI      — 'true' routes to /local-ai/v1
 *   VITE_GROQ_MODEL        — model name override; default llama-3.3-70b-versatile
 *
 * Provider chain (consumers like generateDeckFromTopic):
 *   Groq → Puter → offline template
 * Puter is in `puterProvider.ts`; offline is `templateDeckGenerator.ts`.
 */

import { requireSupabase } from '../database/supabase';
import { useLocalAI } from '../../lib/aiProvider';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const PROXY_BASE_URL = '/api/ai';
const LOCAL_BASE_URL = '/local-ai/v1';

function readEnv(key: string, fallback = ''): string {
  return ((import.meta as any).env ?? {})[key] ?? fallback;
}

function isLocalAI(): boolean {
  return useLocalAI();
}

function getGroqKey(): string {
  return readEnv('VITE_GROQ_API_KEY');
}

/** Supabase session token, or null when there's no signed-in session (or the
 *  Supabase client isn't configured — e.g. in isolated unit tests). */
async function getSessionToken(): Promise<string | null> {
  try {
    const { data } = await requireSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export type GroqRole = 'system' | 'user' | 'assistant' | 'tool';

export interface GroqChatMessage {
  role: GroqRole;
  content: string;
}

interface GroqChatCommon {
  /** Per-call model override. Rare — env + default usually suffice. */
  model?: string;
  /** Token cap for the response. Default 4000. */
  maxTokens?: number;
  /** Sampling temperature. Default 0.7. */
  temperature?: number;
  /** AbortSignal (e.g. for unmount cleanup). */
  signal?: AbortSignal;
}

/**
 * Discriminated union — pick ONE of `prompt` or `messages`. Passing both
 * is a TypeScript compile error, not a runtime edge case.
 */
export type GroqChatOptions =
  | ({ prompt: string; messages?: never } & GroqChatCommon)
  | ({ messages: GroqChatMessage[]; prompt?: never } & GroqChatCommon);

export interface GroqChatResult {
  /** Parsed message content string. Empty string if the model returned nothing. */
  content: string;
  /** Full OpenAI-shape response. Most callers ignore this; exposed for parity with the legacy groqService API. */
  raw: any;
}

/**
 * Tagged error class for Groq unavailability. Marked with `provider: 'groq'`
 * so callers can branch on which provider failed when handling a chain of
 * fallbacks (Puter, offline template, …). Mirrors `PuterUnavailableError`
 * from `puterProvider.ts`.
 *
 * Why typed instead of just `new Error(...)`:
 *   - previously every 4xx/5xx came through as `new Error('Groq API error (NNN): …')`
 *     and callers had to substring-match the message to know what to do.
 *   - Fallback routing decisions (Groq → Puter → offline) should be
 *     type-driven, not text-driven.
 */
export class GroqUnavailableError extends Error {
  /** Identifier used by callers (and analytics) to attribute the failure. */
  readonly provider = 'groq' as const;
  /** HTTP status code if the upstream replied, or 0 for network/abort. */
  readonly status: number;
  /** Sanitised one-line description safe to log. */
  readonly groqMessage: string;
  /** True if Groq explicitly rejected the API key — caller should NOT retry. */
  readonly isAuthFailure: boolean;
  /** True if Groq returned 429 (rate-limited / quota exhausted). */
  readonly isQuotaExhausted: boolean;

  constructor(
    message: string,
    opts: {
      status?: number;
      groqMessage?: string;
      isAuthFailure?: boolean;
      isQuotaExhausted?: boolean;
    } = {},
  ) {
    super(message);
    this.name = 'GroqUnavailableError';
    this.status = opts.status ?? 0;
    this.groqMessage = opts.groqMessage ?? '';
    this.isAuthFailure = !!opts.isAuthFailure;
    this.isQuotaExhausted = !!opts.isQuotaExhausted;
  }
}

/** HTTP status codes indicating "Groq rejected your credentials / config" — never retry. */
const AUTH_STATUSES = new Set([401, 403]);

/**
 * One-time console flag so we don't spam the dev console when the user
 * retries a generation 12 times with the same broken key. Logs the FIRST
 * 401/403 in a session, then stays quiet.
 */
let authFailureBannerLogged = false;

function resolveModel(override?: string): string {
  // Order: per-call → env → hardcoded Groq-current-model fallback.
  const env = readEnv('VITE_GROQ_MODEL');
  const fallback = 'openai/gpt-oss-120b';
  const resolved = override ?? env ?? fallback;
  // Auto-fallback when the configured model is deprecated. Groq 400s with
  // "The model `xyz` has been decommissioned" when an old model name is
  // still in .env.example (e.g. `llama3-8b-8192`). Detect the substring
  // once at module load (cheap) and swap to the safe fallback so the
  // user doesn't have to hand-edit .env to recover.
  if (DEPRECATED_MODEL_NAMES.has(resolved)) {
    if (!deprecatedModelBannerLogged) {
      deprecatedModelBannerLogged = true;
      console.warn(
        `[AuraMind/groqClient] Configured model '${resolved}' is decommissioned by Groq. ` +
        `Falling back to '${fallback}' for this session. Update auramind-gemini/.env (VITE_GROQ_MODEL) and restart.`,
      );
    }
    return fallback;
  }
  return resolved;
}

/** Models Groq has decommissioned. Mirror the union here when Groq sends a
 *  deprecation notice; the resolver swaps to the safe fallback so a stale
 *  .env never blocks the app from booting. */
const DEPRECATED_MODEL_NAMES = new Set<string>([
  'llama3-8b-8192',
  'llama3-70b-8192',
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
  'gemma-7b-it',
]);

/** One-time deprecation banner so a silent model swap never looks like a
 *  bug. Mirrors the `authFailureBannerLogged` pattern in groqChat() —
 *  log once per session, then stay quiet so retrying the same broken
 *  config doesn't spam the console. */
let deprecatedModelBannerLogged = false;

/** Public accessor for the current model + provider. Used by the model
 *  indicator pill in the top app bar — single source of truth so the
 *  displayed name always matches the one actually called. */
export interface GroqModelInfo {
  id: string;
  isLocal: boolean;
  isDeprecated: boolean;
  hasAuth: boolean;
}
export function getCurrentGroqModelInfo(): GroqModelInfo {
  const id = resolveModel();
  return {
    id,
    isLocal: isLocalAI(),
    isDeprecated: DEPRECATED_MODEL_NAMES.has(readEnv('VITE_GROQ_MODEL') ?? id),
    hasAuth: !!getGroqKey(),
  };
}

export async function groqChat(opts: GroqChatOptions): Promise<GroqChatResult> {
  const {
    model: modelOverride,
    maxTokens = 4000,
    temperature = 0.7,
    signal,
  } = opts;

  const localAI = isLocalAI();
  const key = getGroqKey();
  const token = await getSessionToken();

  // Route: on-device → local server; signed-in → server proxy (key stays
  // server-side); otherwise → direct Groq with the client key (dev/tests).
  let endpoint: string;
  let auth: string;
  if (localAI) {
    endpoint = `${LOCAL_BASE_URL}/chat/completions`;
    auth = 'not-needed';
  } else if (token) {
    endpoint = `${PROXY_BASE_URL}/chat`;
    auth = token;
  } else {
    if (!key) {
      throw new GroqUnavailableError(
        'groqChat: no API key. Set VITE_GROQ_API_KEY in .env or enable VITE_USE_LOCAL_AI=true.',
        {},
      );
    }
    endpoint = `${GROQ_BASE_URL}/chat/completions`;
    auth = key;
  }

  // TypeScript narrows `opts` correctly here: when the prompt branch is
  // active, `opts.messages` is `never`; when the messages branch is
  // active, only `opts.messages` is readable.
  const finalMessages: GroqChatMessage[] =
    'prompt' in opts
      ? [{ role: 'user', content: opts.prompt ?? '' }]
      : opts.messages;

  const res = await fetch(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify({
        model: resolveModel(modelOverride),
        messages: finalMessages,
        temperature,
        max_tokens: maxTokens,
      }),
      ...(signal ? { signal } : {}),
    },
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as any));
    const upstreamMessage: string =
      errBody?.error?.message ?? errBody?.error ?? `HTTP ${res.status} ${res.statusText}`;

    if (AUTH_STATUSES.has(res.status)) {
      // Categorised auth failure — never retry, callers must fall back.
      // Single console banner per session so a frustrated user clicking
      // "Generate AI deck" 10× doesn't log 10× the same line.
      if (!authFailureBannerLogged) {
        authFailureBannerLogged = true;
        // Use console.warn, not console.error — this is a CONFIG issue, not a
        // runtime exception. Spamming red error noise obscures real bugs.
        console.warn(
          `[AuraMind/groqClient] Groq rejected the API key (HTTP ${res.status} ${upstreamMessage}). ` +
          `AI features will use the Puter free fallback or offline template for this session. ` +
          `Fix the key in auramind-gemini/.env (VITE_GROQ_API_KEY) and restart \`npm run dev\`.`,
        );
      }
      throw new GroqUnavailableError(
        `Groq rejected the API key (HTTP ${res.status}): ${upstreamMessage}`,
        { status: res.status, groqMessage: upstreamMessage, isAuthFailure: true },
      );
    }

    // 429 → quota / rate limit; 5xx → upstream outage; otherwise → generic
    // "AI provider unavailable" the caller can route to fallback.
    throw new GroqUnavailableError(
      `Groq API error (${res.status}): ${upstreamMessage}`,
      {
        status: res.status,
        groqMessage: upstreamMessage,
        isAuthFailure: false,
        isQuotaExhausted: res.status === 429,
      },
    );
  }

  const raw = await res.json();
  const content: string = raw?.choices?.[0]?.message?.content ?? '';
  return { content, raw };
}

/**
 * groqChatStream — streaming variant that yields tokens as they arrive.
 * Uses the same Groq chat completions endpoint with `stream: true`.
 * Each yielded chunk is a string of newly-received content.
 *
 * Usage:
 *   const stream = groqChatStream({ messages });
 *   for await (const chunk of stream) {
 *     appendToUI(chunk);
 *   }
 */
/**
 * groqTranscribe — transcribe audio via Groq Whisper (whisper-large-v3).
 *
 * Groq hosts Whisper at the OpenAI-compatible `/audio/transcriptions`
 * endpoint. The audio is sent as multipart form-data (a Blob + filename +
 * model). Returns the transcribed text, or throws `GroqUnavailableError`
 * on the same classification as chat (401/403 never retry, 429 quota,
 * 5xx upstream).
 *
 * Usage:
 *   const text = await groqTranscribe(audioBlob, 'recording.webm');
 */
export async function groqTranscribe(
  audio: Blob,
  filename = 'recording.webm',
  model = 'whisper-large-v3',
): Promise<string> {
  const key = getGroqKey();
  if (!key) {
    throw new GroqUnavailableError(
      'groqTranscribe: no API key. Set VITE_GROQ_API_KEY in .env.',
      {},
    );
  }

  const form = new FormData();
  form.append('file', audio, filename);
  form.append('model', model);
  form.append('language', 'en');

  const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as any));
    const upstreamMessage: string =
      errBody?.error?.message ?? `HTTP ${res.status} ${res.statusText}`;
    throw new GroqUnavailableError(
      `Groq transcription error (${res.status}): ${upstreamMessage}`,
      {
        status: res.status,
        groqMessage: upstreamMessage,
        isAuthFailure: AUTH_STATUSES.has(res.status),
        isQuotaExhausted: res.status === 429,
      },
    );
  }

  const json = await res.json();
  return json?.text ?? '';
}

/**
 * groqSpeech — text-to-speech via Groq (currently unavailable upstream).
 *
 * Groq has no public TTS endpoint as of August 2026, so this returns
 * `null` and callers should fall back to the browser's built-in
 * `speechSynthesis` (which `useVoiceStudy` uses). Kept as a typed
 * seam so swapping in an external TTS (OpenAI, ElevenLabs, Cartesia)
 * later is a one-file change.
 */
export async function groqSpeech(_text: string): Promise<ArrayBuffer | null> {
  // No Groq TTS endpoint yet — return null to signal "use browser TTS".
  return null;
}

export async function* groqChatStream(
  opts: GroqChatOptions,
): AsyncGenerator<string> {
  const {
    model: modelOverride,
    maxTokens = 4000,
    temperature = 0.7,
    signal,
  } = opts;

  const localAI = isLocalAI();
  const key = getGroqKey();
  const token = await getSessionToken();

  // Same routing as groqChat(): on-device → local server; signed-in → server
  // proxy; otherwise → direct Groq with the client key (dev/tests).
  let endpoint: string;
  let auth: string;
  if (localAI) {
    endpoint = `${LOCAL_BASE_URL}/chat/completions`;
    auth = 'not-needed';
  } else if (token) {
    endpoint = `${PROXY_BASE_URL}/chat/stream`;
    auth = token;
  } else {
    if (!key) {
      throw new GroqUnavailableError(
        'groqChatStream: no API key. Set VITE_GROQ_API_KEY in .env or enable VITE_USE_LOCAL_AI=true.',
        {},
      );
    }
    endpoint = `${GROQ_BASE_URL}/chat/completions`;
    auth = key;
  }

  const finalMessages: GroqChatMessage[] =
    'prompt' in opts
      ? [{ role: 'user', content: opts.prompt ?? '' }]
      : opts.messages;

  const res = await fetch(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify({
        model: resolveModel(modelOverride),
        messages: finalMessages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
      ...(signal ? { signal } : {}),
    },
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as any));
    const upstreamMessage: string =
      errBody?.error?.message ?? errBody?.error ?? `HTTP ${res.status} ${res.statusText}`;
    // Same classification as groqChat() — streaming failures also produce
    // GroqUnavailableError so callers can branch uniformly.
    throw new GroqUnavailableError(
      `Groq API error (${res.status}): ${upstreamMessage}`,
      {
        status: res.status,
        groqMessage: upstreamMessage,
        isAuthFailure: AUTH_STATUSES.has(res.status),
        isQuotaExhausted: res.status === 429,
      },
    );
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('groqChatStream: response body reader unavailable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
