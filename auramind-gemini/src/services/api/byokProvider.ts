/**
 * byokProvider — BYOK (Bring-Your-Own-Key) implementation.
 *
 * Accepts user-supplied keys for Groq, Google Gemini, OpenRouter,
 * OpenAI, and Anthropic. Keys are passed in at call-time so this
 * module never reaches across the wire on import. The router reads
 * from localStorage and forwards here; we never persist keys.
 *
 * Provider preference:
 *   1. Groq (fastest free-tier) if `keys.groq` set.
 *   2. OpenRouter free models fall back next.
 *   3. Gemini free tier.
 *   4. OpenAI / Anthropic paid (last; never free, but a paying user's
 *      experience shouldn't be capped).
 */
import type { AIChatRequest } from "@/services/ai/freeAIRouter";

interface BYOKKeys {
  groq?: string;
  gemini?: string;
  openrouter?: string;
  openai?: string;
  anthropic?: string;
}

export interface BYOKResponse {
  text: string;
}

// Anthropic is excluded from the runtime chain on purpose — api.anthropic.com
// does not allow direct browser CORS, so passing an Anthropic key here will
// always 0/cors-block. The right fix is to proxy Anthropic calls through a
// Vercel /api function (server-side fetch + user's key forwarded); when that
// proxy lands, re-add "anthropic" to PREFERRED_ORDER and put the request
// logic back in byokProvider as a wrapper around the proxy. Until then, a
// user with only an Anthropic key gets a clear "no provider succeeded" so
// they know to either add Groq/OpenRouter/Gemini/OpenAI OR wait for the proxy.
const PREFERRED_ORDER: Array<keyof BYOKKeys> = [
  "groq",
  "openrouter",
  "gemini",
  "openai",
];

async function callGroq(req: AIChatRequest, key: string): Promise<string> {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        ...(req.systemPrompt
          ? [{ role: "system", content: req.systemPrompt }]
          : []),
        { role: "user", content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 600,
      temperature: req.temperature ?? 0.7,
      stream: false,
    }),
  });
  if (!r.ok) {
    throw new Error(`groq ${r.status}: ${await r.text().catch(() => "")}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callOpenRouter(req: AIChatRequest, key: string): Promise<string> {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        ...(req.systemPrompt
          ? [{ role: "system", content: req.systemPrompt }]
          : []),
        { role: "user", content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 600,
      temperature: req.temperature ?? 0.7,
    }),
  });
  if (!r.ok) {
    throw new Error(`openrouter ${r.status}: ${await r.text().catch(() => "")}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callGemini(req: AIChatRequest, key: string): Promise<string> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: req.prompt }],
          },
        ],
        systemInstruction: req.systemPrompt
          ? { parts: [{ text: req.systemPrompt }] }
          : undefined,
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.maxTokens ?? 600,
        },
      }),
    },
  );
  if (!r.ok) {
    throw new Error(`gemini ${r.status}: ${await r.text().catch(() => "")}`);
  }
  const data = await r.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  );
}

async function callOpenAI(req: AIChatRequest, key: string): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        ...(req.systemPrompt
          ? [{ role: "system", content: req.systemPrompt }]
          : []),
        { role: "user", content: req.prompt }],
      max_tokens: req.maxTokens ?? 600,
      temperature: req.temperature ?? 0.7,
    }),
  });
  if (!r.ok) {
    throw new Error(`openai ${r.status}: ${await r.text().catch(() => "")}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(
  _req: AIChatRequest,
  _key: string,
): Promise<string> {
  // Direct browser → api.anthropic.com is blocked by CORS. Until the
  // /api/byok/anthropic Vercel proxy lands, this branch only throws so the
  // router cleanly falls through to the deterministic template.
  throw new Error(
    "anthropic: requires server proxy — direct browser call is CORS-blocked",
  );
}

const PROVIDERS: Record<
  keyof BYOKKeys,
  (req: AIChatRequest, key: string) => Promise<string>
> = {
  groq: callGroq,
  openrouter: callOpenRouter,
  gemini: callGemini,
  openai: callOpenAI,
  anthropic: callAnthropic,
};

const PROVIDER_LABELS: Record<keyof BYOKKeys, string> = {
  groq: "Groq",
  openrouter: "OpenRouter",
  gemini: "Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic (proxy required)",
};

export async function byokChat(
  req: Omit<AIChatRequest, "forceProvider"> & { keys: BYOKKeys },
): Promise<BYOKResponse> {
  for (const id of PREFERRED_ORDER) {
    const key = req.keys[id];
    if (!key) continue;
    try {
      const text = await PROVIDERS[id](req, key);
      if (text && text.trim()) return { text };
    } catch (e) {
      // Try the next provider rather than bubble up. The router falls
      // back to a deterministic template if every provider fails.
      console.warn(`[byok] ${PROVIDER_LABELS[id]} failed:`, e);
    }
  }
  throw new Error("No BYOK provider succeeded — falling back to template");
}
