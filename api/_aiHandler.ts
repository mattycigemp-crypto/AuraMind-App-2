/**
 * Server-side AI proxy for Groq chat completions.
 *
 * Moves the Groq API key out of the client bundle: browsers authenticate to
 * these endpoints with their Supabase session token and the function injects
 * the server-side key (GROQ_API_KEY) before forwarding to api.groq.com.
 *
 * Endpoints (mounted at /api/ai via the catch-all in index.ts):
 *   POST /api/ai/chat        — non-streaming completion, OpenAI-shaped JSON
 *   POST /api/ai/chat/stream — OpenAI-style SSE deltas (choices[0].delta.content)
 *
 * Security properties:
 *   - Requires a valid Supabase session (Bearer token) — mirrors /api/search
 *     and /api/email so anonymous callers can't burn the key.
 *   - Model is allowlisted; unknown models fall back to the server default.
 *     A stale bundle can never steer the server toward a pricier model.
 *   - Messages/content are length-capped and role-whitelisted.
 *   - temperature / max_tokens are clamped to prevent cost abuse.
 *   - Per-user in-memory rate limit on top of the IP bucket in _middleware.ts.
 *   - The Groq key is never echoed in error bodies.
 *
 * Usage is logged to the `chat_logs` table for analytics/cost attribution.
 */

import { createClient } from '@supabase/supabase-js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Server-side key only. VITE_GROQ_API_KEY is a build-time fallback so the
// function keeps working before GROQ_API_KEY is set in the dashboard — it is
// never returned to the client.
function getGroqKey(): string {
  return process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
}

// Models the server will forward. The client may request any of these;
// anything else silently resolves to the default so an outdated bundle
// cannot pick a model Groq no longer serves (or one we haven't budgeted).
const ALLOWED_MODELS = new Set([
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-safeguard-20b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'groq/compound-mini',
]);
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 8000;
const MAX_TOKENS = 8192;

// Per-user rate limit (in addition to the per-IP bucket in _middleware.ts).
// In-memory like the rest of the app's limiting — swap for Redis/Upstash
// when the platform outgrows a single region.
const USER_RATE_LIMIT_WINDOW = 60_000;
const USER_RATE_LIMIT_MAX = 60;
const userRateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkUserRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = userRateLimitStore.get(userId);
  if (!entry || now > entry.resetAt) {
    userRateLimitStore.set(userId, { count: 1, resetAt: now + USER_RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: USER_RATE_LIMIT_MAX - 1 };
  }
  entry.count++;
  return {
    allowed: entry.count <= USER_RATE_LIMIT_MAX,
    remaining: Math.max(0, USER_RATE_LIMIT_MAX - entry.count),
  };
}

interface AiBody {
  model?: unknown;
  messages?: unknown;
  temperature?: unknown;
  max_tokens?: unknown;
}

/** Loosely typed request/response so this works behind both Vercel's
 *  catch-all (VercelResponse) and the standalone Express server (express.Response). */
interface AiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface AiResponse {
  status: (code: number) => AiResponse;
  setHeader: (name: string, value: string) => AiResponse;
  json: (body: Record<string, unknown>) => void;
  send: (body: string) => void;
  write: (chunk: string) => void;
  end: () => void;
  flushHeaders?: () => void;
}

export async function handleAI(
  req: AiRequest,
  res: AiResponse,
  action?: string,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (action !== 'chat' && action !== 'chat/stream') {
    res.status(400).json({ error: 'Invalid AI action. Use: chat, chat/stream' });
    return;
  }

  const groqKey = getGroqKey();
  if (!groqKey) {
    res.status(503).json({ error: 'AI service is not configured on the server' });
    return;
  }

  // Authenticate the caller with their Supabase session token.
  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization' });
    return;
  }
  const token = String(authHeader).replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Missing authorization' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseServiceKey) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Per-user rate limit.
  const userLimit = checkUserRateLimit(user.id);
  res.setHeader('X-RateLimit-Remaining', String(userLimit.remaining));
  if (!userLimit.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded. Please wait before sending another message.' });
    return;
  }

  // Validate + clamp the payload (never forward unknown fields).
  const body = (req.body ?? {}) as AiBody;
  const model =
    typeof body.model === 'string' && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;

  let candidates: any[] = Array.isArray(body.messages) ? body.messages : [];
  if (candidates.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }
  // Cap the conversation while always keeping the system prompt: a long chat
  // session would otherwise push the instructions out of the window and
  // silently change the model's behaviour.
  if (candidates.length > MAX_MESSAGES) {
    const sysIdx = candidates.findIndex((m: any) => m?.role === 'system');
    const sys = sysIdx >= 0 ? [candidates[sysIdx]] : [];
    const rest = candidates.filter((_: any, i: number) => i !== sysIdx);
    candidates = [...sys, ...rest.slice(-(MAX_MESSAGES - sys.length))];
  }

  const messages = candidates
    .map((m: any) => ({
      role: typeof m?.role === 'string' && ['system', 'user', 'assistant', 'tool'].includes(m.role)
        ? m.role
        : 'user',
      content: typeof m?.content === 'string' ? m.content.slice(0, MAX_MESSAGE_LENGTH) : '',
    }))
    .filter((m: { content: string }) => m.content.length > 0);

  if (messages.length === 0) {
    res.status(400).json({ error: 'messages array cannot be empty' });
    return;
  }

  const temperature = typeof body.temperature === 'number' ? Math.min(Math.max(body.temperature, 0), 2) : 0.7;
  const max_tokens = typeof body.max_tokens === 'number'
    ? Math.min(Math.max(Math.floor(body.max_tokens), 1), MAX_TOKENS)
    : 2000;
  const stream = action === 'chat/stream';

  const upstreamBody = JSON.stringify({
    model,
    messages,
    temperature,
    max_tokens,
    ...(stream ? { stream: true } : {}),
  });

  const startTime = Date.now();
  let tokensGenerated = 0;
  let responsePreview = '';
  let streamFailed = false;

  try {
    const upstream = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: upstreamBody,
    });

    if (!upstream.ok) {
      const errText = (await upstream.text().catch(() => '')).slice(0, 500);
      const message = errText || `Upstream error (${upstream.status})`;
      // Pass the status through so the client's typed error classification
      // (auth / 429 / 5xx) keeps working unchanged.
      if (stream) {
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        res.status(upstream.status).setHeader('Content-Type', 'application/json').send(JSON.stringify({ error: message }));
      }
      streamFailed = true;
      return;
    }

    if (!stream) {
      const jsonBody = await upstream.json();
      const content: string = jsonBody?.choices?.[0]?.message?.content ?? '';
      responsePreview = content.slice(0, 500);
      tokensGenerated = typeof jsonBody?.usage?.completion_tokens === 'number'
        ? jsonBody.usage.completion_tokens
        : 0;
      res.status(200).setHeader('Content-Type', 'application/json').send(JSON.stringify(jsonBody));
      return;
    }

    // Streaming: forward OpenAI-style SSE deltas verbatim.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    const reader = upstream.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to read AI response stream' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      streamFailed = true;
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let sawDone = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          sawDone = true;
          res.write('data: [DONE]\n\n');
          continue;
        }
        res.write(`data: ${payload}\n\n`);
        tokensGenerated++;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string') responsePreview += delta;
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    if (!sawDone) res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[AIHandler] proxy error:', err);
    if (stream) {
      res.write(`data: ${JSON.stringify({ error: 'Connection to AI service failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(502).setHeader('Content-Type', 'application/json').send(
        JSON.stringify({ error: err?.message || 'AI service unavailable' }),
      );
    }
    streamFailed = true;
  } finally {
    // Best-effort usage logging for analytics / cost attribution.
    try {
      await supabase.from('chat_logs').insert({
        user_id: user.id,
        messages: messages as any,
        response_preview: responsePreview.slice(0, 500),
        tokens_generated: tokensGenerated,
        model,
        duration_ms: Date.now() - startTime,
        success: !streamFailed,
        error_message: streamFailed ? 'AI proxy failed' : null,
        created_at: new Date().toISOString(),
      });
    } catch (logErr: any) {
      console.error('[AIHandler] Failed to log AI call:', logErr.message);
    }
  }
}