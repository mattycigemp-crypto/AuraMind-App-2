/**
 * AuraMind Chat Stream — Supabase Edge Function (Deno)
 *
 * Proxies chat completions to Groq with streaming, returning SSE events.
 * The client reads `data:` lines and updates the UI token-by-token.
 *
 * WHY a Supabase Edge Function instead of direct client-to-Groq:
 *   1. API key stays server-side (never leaks to the browser).
 *   2. Future rate-limiting, auth, usage tracking, and AI-provider
 *      rotation all live in one place.
 *   3. The client gets a unified endpoint regardless of the AI provider.
 *
 * Deploy:
 *   supabase functions deploy chat-stream --no-verify-jwt
 *
 * Usage (from the frontend):
 *   const res = await fetch(
 *     `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stream`,
 *     {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         messages: [
 *           { role: 'system', content: '...' },
 *           { role: 'user', content: '...' },
 *         ],
 *         maxTokens: 2000,
 *         temperature: 0.7,
 *       }),
 *     },
 *   );
 *   const reader = res.body.getReader();
 *   // Parse SSE data: lines...
 *   // Each data: line contains { content: "..." } or [DONE]
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

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

serve(async (req: Request) => {
  // CORS headers for browser access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: ChatStreamBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.messages?.length) {
    return new Response(JSON.stringify({ error: 'Messages array is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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
      const message = errBody?.error?.message ?? `Groq HTTP ${groqRes.status}`;
      return new Response(
        `data: ${JSON.stringify({ error: message })}\n\ndata: [DONE]\n\n`,
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        },
      );
    }

    // Create a TransformStream to pipe the Groq stream through SSE formatting
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Pipe Groq stream to SSE response
    (async () => {
      try {
        const reader = groqRes.body?.getReader();
        if (!reader) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'No stream' })}\n\n`));
          await writer.write(encoder.encode('data: [DONE]\n\n'));
          await writer.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

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
              await writer.write(encoder.encode('data: [DONE]\n\n'));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) {
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
                );
              }
            } catch {
              // Skip malformed JSON lines
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
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
                  );
                }
              } catch { /* skip */ }
            }
          }
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (err: any) {
        console.error('Chat stream error:', err);
        try {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`),
          );
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch { /* writer may be closed */ }
      } finally {
        await writer.close().catch(() => {});
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(
      `data: ${JSON.stringify({ error: err.message })}\n\ndata: [DONE]\n\n`,
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      },
    );
  }
});
