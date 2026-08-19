import { createClient } from '@supabase/supabase-js';

const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || 'http://127.0.0.1:8000';
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const SYSTEM_PROMPT = `You are Aura, the AI study companion of **AuraMind** — a full-stack learning platform. You help students understand concepts, think critically, and work with their study materials.

## About AuraMind
AuraMind is a complete study application with:
- **Flashcards & Decks** — Spaced repetition-based studying with AI-generated cards
- **Quizzes** — Multi-format assessments generated from any topic or uploaded document
- **AI Generator** — Create flashcards, quizzes, and study decks from topics, URLs, YouTube videos, or uploaded documents
- **Lessons** — Structured lessons combining explanations with embedded quizzes and flashcards
- **Analytics** — Study stats, XP, streaks, retention charts, mastery tracking
- **Learning Paths** — Curated study roadmaps

## TEACHING APPROACH (SOCRATIC METHOD)
- NEVER give direct answers to study questions immediately
- Guide the student to the answer through probing questions
- Break complex topics into smaller, digestible steps
- Use analogies and real-world examples
- Praise correct reasoning and gently correct misconceptions

## CAPABILITIES
- Answer questions and explain concepts using the Socratic method
- Help with homework by guiding, not giving answers
- Explain complex topics in simple terms
- Provide study tips and learning strategies

## RESPONSE FORMAT
- Be concise but thorough
- Use clear section breaks for complex topics
- Always encourage critical thinking
- When the user asks to create study materials, guide them to the Generator page

## PERSONALITY
- Enthusiastic about learning
- Patient and encouraging
- Direct and honest about limitations`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StreamChunk {
  token: string;
}

interface ChatLogEntry {
  user_id: string | null;
  messages: ChatMessage[];
  response_preview: string;
  tokens_generated: number;
  model: string;
  duration_ms: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  entry.count++;
  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
  };
}

function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export async function handleChatStream(
  req: {
    headers: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
    query?: { message?: string; token?: string };
  },
  res: {
    status: (code: number) => any;
    setHeader: (name: string, value: string) => any;
    write: (chunk: string) => any;
    end: () => any;
    json: (body: any) => any;
    flushHeaders?: () => any;
  },
  rawQuery?: { message?: string; token?: string },
) {
  const message = rawQuery?.message || (req.query?.message as string) || '';

  if (!message || message.trim().length === 0) {
    res.status(400).json({ error: 'message query parameter is required' });
    return;
  }

  if (message.length > 4096) {
    res.status(400).json({ error: 'message exceeds maximum length of 4096 characters' });
    return;
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`chat:${clientIp}`);
  if (!rateLimit.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded. Please wait before sending another message.' });
    return;
  }

  let supabase: ReturnType<typeof createClient> | null = null;
  let userId: string | null = null;
  const authToken = rawQuery?.token || (req.query?.token as string) || '';
  if (authToken) {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseUrl && supabaseServiceKey) {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user } } = await supabase.auth.getUser(authToken);
        userId = user?.id || null;
      }
    } catch {
      /* auth is best-effort */
    }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];

  const startTime = Date.now();
  let tokensGenerated = 0;
  let responsePreview = '';
  let streamFailed = false;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let aborted = false;

  try {
    const backendResponse = await fetch(`${MODEL_SERVICE_URL}/stream-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        messages,
        temperature: 0.3,
        max_tokens: 2048,
        top_p: 0.9,
        repetition_penalty: 1.1,
      }),
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error(`[ChatHandler] Model service returned ${backendResponse.status}: ${errorBody}`);
      res.write(`data: ${JSON.stringify({ error: `Model service error: ${backendResponse.statusText}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      streamFailed = true;
      return;
    }

    const reader = backendResponse.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to read model response stream' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      streamFailed = true;
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      if (aborted) break;

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
          res.write('data: [DONE]\n\n');
          break;
        }

        res.write(`data: ${payload}\n\n`);
        tokensGenerated++;

        try {
          const parsed: StreamChunk = JSON.parse(payload);
          if (parsed.token) {
            responsePreview += parsed.token;
          }
        } catch {
          /* skip unparseable chunks */
        }
      }
    }

    if (!aborted && !buffer.includes('[DONE]')) {
      res.write('data: [DONE]\n\n');
    }
  } catch (err) {
    console.error('[ChatHandler] Stream proxy error:', err);
    if (!aborted) {
      res.write(`data: ${JSON.stringify({ error: 'Connection to AI service failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
    }
    streamFailed = true;
  } finally {
    if (!aborted) {
      res.end();
    }

    const durationMs = Date.now() - startTime;

    if (supabase && userId) {
      const logEntry: ChatLogEntry = {
        user_id: userId,
        messages,
        response_preview: responsePreview.slice(0, 500),
        tokens_generated: tokensGenerated,
        model: 'qwen2.5-coder-14b',
        duration_ms: durationMs,
        success: !streamFailed,
        error_message: streamFailed ? 'Stream encountered an error' : null,
        created_at: new Date().toISOString(),
      };

      supabase.from('chat_logs').insert(logEntry as any).then(
        () => {},
        (err) => console.error('[ChatHandler] Failed to log chat:', err),
      );
    }
  }
}
