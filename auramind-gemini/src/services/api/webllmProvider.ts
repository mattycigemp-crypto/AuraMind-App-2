/**
 * webllmProvider — wrapper around @mlc-ai/web-llm that uses our singleton
 * engine from prior turns.
 *
 * Behavior:
 *  - One engine instance per session, shared across users.
 *  - First call downloads the model (~2 GB, cached after that in IndexedDB).
 *  - WebGPU-only — gracefully throws a clear error so the router can
 *    fall back to BYOK when running on a non-WebGPU browser.
 */
import type { AIChatRequest } from "@/services/ai/freeAIRouter";

let cachedEngine: any | null = null;
let loadingPromise: Promise<any> | null = null;

const MODEL_ID = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

export async function getOrCreateWebLLMEngine(
  onProgress?: (progress: { text: string }) => void,
): Promise<any> {
  if (cachedEngine) return cachedEngine;
  if (loadingPromise) return loadingPromise;
  // Lazy-import so users who never hit WebLLM path don't download MLC runtime.
  const [mlc] = await Promise.all([
    import("@mlc-ai/web-llm").catch((e) => {
      throw new Error(
        `WebLLM runtime not available in this build: ${String(e?.message ?? e)}`,
      );
    }),
  ]);
  loadingPromise = mlc
    .CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (rep: any) => {
        onProgress?.({ text: String(rep?.text ?? "loading") });
      },
    })
    .then((engine: any) => {
      cachedEngine = engine;
      loadingPromise = null;
      return engine;
    })
    .catch((err: unknown) => {
      loadingPromise = null;
      throw err;
    });
  return loadingPromise;
}

export interface WebLLMResponse {
  text: string;
}

export async function webllmChat(
  req: Omit<AIChatRequest, "forceProvider">,
): Promise<WebLLMResponse> {
  const engine = await getOrCreateWebLLMEngine();
  const mlc = await import("@mlc-ai/web-llm");
  const messages: any[] = [];
  if (req.systemPrompt) messages.push({ role: "system", content: req.systemPrompt });
  messages.push({ role: "user", content: req.prompt });

  const reply = await engine.chat.completions.create({
    messages,
    temperature: req.temperature ?? 0.7,
    max_tokens: req.maxTokens ?? 600,
  });
  void mlc; // keep import alive for type narrowing.
  const text =
    reply?.choices?.[0]?.message?.content ??
    reply?.choices?.[0]?.text ??
    "";
  return { text: String(text) };
}
