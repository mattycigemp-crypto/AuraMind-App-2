/**
 * AuraMind Chat Stream — Vercel Serverless Function (SSE)
 *
 * Proxies chat completions to Groq with streaming, returning SSE events.
 * The client reads `data:` lines and updates the UI token-by-token.
 *
 * WHY a server proxy instead of direct client-to-Groq:
 *   1. API key stays server-side (never leaks to the browser).
 *   2. Future rate-limiting, auth, usage tracking, and AI-provider
 *      rotation all live in one place.
 *   3. The client gets a unified /api/chat/stream endpoint regardless
 *      of what model/provider powers it.
 *
 * Usage (from the frontend):
 *   const res = await fetch('/api/chat/stream', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       messages: [
 *         { role: 'system', content: '...' },
 *         { role: 'user', content: '...' },
 *       ],
 *       maxTokens: 2000,
 *       temperature: 0.7,
 *     }),
 *   });
 *
 *   const reader = res.body.getReader();
 *   // Parse SSE data: lines...
 *   // Each data: line either contains a JSON chunk with { content: "..." }
 *   // or the [DONE] signal.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

interface ChatStreamBody {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const FALLBACK_MODEL = 'llama-3.3-70b-versatile';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as ChatStreamBody;
  if (!body?.messages?.length) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  const groqKey = process.env.VITE_GROQ_API_KEY;
  if (!groqKey) {
    res.status(500).json({ error: 'GROQ API key not configured' });
    return;
  }

  // ── Set SSE headers ──────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx proxy support

  try {
    const groqRes = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: body.model || FALLBACK_MODEL,
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.maxTokens ?? 4000,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.json().catch(() => ({} as any));
      const message =
        errBody?.error?.message ?? `Groq HTTP ${groqRes.status}`;
      // Send error as SSE so the client can gracefully degrade
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const reader = groqRes.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response stream' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // ── Stream SSE events ──────────────────────────────────────────
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
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        } catch {
          // Malformed JSON — skip
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          } catch { /* skip */ }
        }
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (err: any) {
    console.error('Chat stream error:', err);
    // Attempt to send error as SSE
    try {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
    } catch { /* client may have disconnected */ }
  } finally {
    res.end();
  }
}
