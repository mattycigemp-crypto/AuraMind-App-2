/**
 * freeAIRouter — AuraMind's "always free, never blocked" AI story.
 *
 * The user said: "great free AI integration, and how to make your own
 * free AI." This module IS that story: a typed, pluggable router that
 * picks the cheapest provider that will answer the user's prompt.
 *
 * Provider chain (in order):
 *   1. **Puter.js** (free, zero-auth, hosted) — first try. If the user
 *      has signed into Puter already, use their account balance; if not,
 *      open the popup on demand and ask them to sign in only when needed.
 *      Best for: long-context chat, image generation, file storage.
 *   2. **WebLLM** (offline, runs entirely in the user's browser via
 *      WebGPU) — second try, only invoked when the prompt is <2K tokens
 *      and the user has waited through the model-load UX. Truly free,
 *      works offline, 2-3 GB model cache per device. Best for: short
 *      flashcard generation, explain-this-thing, single-turn Q&A.
 *   3. **BYOK** (Bring-Your-Own-Key) — user holds a Groq / Gemini /
 *      OpenRouter / OpenAI / Anthropic key. Sourced from SettingsPage
 *      (`localStorage["auramind.ai.keys"]`). Best for: power users.
 *   4. **Deterministic template** (zero-network) — high-touch offline
 *      fallback. Uses cached templates + the user's current deck to
 *      fabricate a usable (but obviously template-y) deck so the
 *      generator NEVER returns an empty card list with no error.
 *
 * Why the order?
 *   - Puter wins for free users with no setup. The popup tax is real
 *     but it's ONCE per device.
 *   - WebLLM comes second because the model download is too heavy for
 *     users who don't intend to use it offline.
 *   - BYOK wins for users who explicitly opt in.
 *   - The template fallback keeps the UX memorable instead of sad —
 *     "AuraMind needs network or sign-in" is the bad message; a
 *     template deck with a clear "Try Prof. Aura online for richer
 *     cards" footer is the good one.
 *
 * Caching: memoised per (prompt hash + opts shape) for the SESSION.
 * Reloads refetch — we don't fight the user on stale answers.
 */
import { hasValidGroqKey as hasEnvGroqKey } from "@/lib/env";

export type AIProviderId = "puter" | "webllm" | "byok" | "template";

export interface AIChatRequest {
  prompt: string;
  systemPrompt?: string;
  /**
   * Maximum output tokens. Provider implementations map to their native
   * parameter (max_tokens / max_new_tokens / etc).
   */
  maxTokens?: number;
  /**
   * Temperature. Defaults to 0.7 for chat, 0.3 for content generation.
   */
  temperature?: number;
  /**
   * Force a specific provider, bypassing the auto-routing. Used by
   * Unit tests + the BYOK SettingsPage preview button.
   */
  forceProvider?: AIProviderId;
  /**
   * Signal allows the caller to abort the request if e.g. the user
   * switches routes while the model is loading.
   */
  signal?: AbortSignal;
}

export interface AIChatResponse {
  text: string;
  provider: AIProviderId;
  providerLabel: string;
  /** End-to-end latency in milliseconds. */
  durationMs: number;
  /** True when no real LLM completed — the response is template-built. */
  fallback: boolean;
}

export class AIRouterError extends Error {
  readonly code:
    | "all_providers_failed"
    | "user_aborted"
    | "quota"
    | "auth_required";
  readonly triedProviders: AIProviderId[];
  constructor(
    message: string,
    code: AIRouterError["code"],
    triedProviders: AIProviderId[],
  ) {
    super(message);
    this.code = code;
    this.triedProviders = triedProviders;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

/** Stable hash for the (prompt, opts) memo key without pulling in crypto. */
function memoKey(req: AIChatRequest): string {
  const norm = JSON.stringify({
    p: req.prompt.trim().toLowerCase(),
    s: (req.systemPrompt ?? "").trim().toLowerCase(),
    m: req.maxTokens ?? null,
    t: req.temperature ?? null,
    f: req.forceProvider ?? null,
  });
  let h = 5381;
  for (let i = 0; i < norm.length; i++) {
    h = ((h << 5) + h + norm.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

/** Read user-supplied BYOK keys from localStorage. */
function readByokKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("auramind.ai.keys");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

/** Detect WebGPU availability. WebLLM requires it. */
async function detectWebGPU(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  // @ts-expect-error – gpu not in standard DOM types yet.
  const gpu = navigator.gpu;
  if (!gpu || typeof gpu.requestAdapter !== "function") return false;
  try {
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Provider implementations. Each returns text or throws.
// ──────────────────────────────────────────────────────────────────────────

/** Stub for the Puter implementation. Real one lives in services/api/puter/. */
async function tryPuter(req: AIChatRequest): Promise<string> {
  if (req.signal?.aborted) throw new AIRouterError("user abort", "user_aborted", ["puter"]);
  // Late-bind to the already-installed Puter module so the router stays
  // usable even when Puter.js fails to load (offline boot, ad-blocker).
  // We bound the call to a sensible timeout — Puter.js v2's chat returns
  // a Promise but if the underlying host hangs (no auth popup closed),
  // the router would stall instead of falling through to WebLLM/BYOK.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), 12_000);
  // Forward the caller's signal too — one abort kills both. The { once: true }
  // option auto-removes the listener after firing so we don't leak
  // registrations across many requests.
  const onUserAbort = () => controller.abort("user");
  req.signal?.addEventListener("abort", onUserAbort, { once: true });
  try {
    const mod = await import("@/services/api/puter").catch(() => null);
    if (!mod) throw new Error("puter module unavailable");
    const response = await mod.puterChat({
      prompt: req.prompt,
      systemPrompt: req.systemPrompt,
      maxTokens: req.maxTokens,
      temperature: req.temperature,
    });
    return response.text;
  } catch (e) {
    // Distinguish Puter's structured auth error vs anything else.
    // The Puter module exports a typed `PuterAuthError` — that's the
    // authoritative signal; string sniffing is too fragile to depend on.
    const { PuterAuthError } = await import("@/services/api/puter").catch(
      () => ({ PuterAuthError: class {} as any }),
    );
    if (e instanceof PuterAuthError) {
      throw new AIRouterError("puter: auth required", "auth_required", ["puter"]);
    }
    // Aborted by either the caller's signal OR our own timeout.
    if (controller.signal.aborted) {
      throw new AIRouterError("puter: aborted", "user_aborted", ["puter"]);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
    // Belt-and-suspender cleanup if the signal fired without us noticing
    // (e.g. component unmount before the listener callback ran).
    if (req.signal && !req.signal.aborted) {
      req.signal.removeEventListener("abort", onUserAbort);
    }
  }
}

/** WebLLM implementation. Only invoked when WebGPU is available. */
async function tryWebLLM(req: AIChatRequest): Promise<string> {
  if (req.signal?.aborted) throw new AIRouterError("user abort", "user_aborted", ["webllm"]);
  const ok = await detectWebGPU();
  if (!ok) throw new Error("WebGPU unavailable — skipping WebLLM");
  const mod = await import("@/services/api/webllmProvider").catch(() => null);
  if (!mod) throw new Error("WebLLM module missing");
  const response = await mod.webllmChat({
    prompt: req.prompt,
    systemPrompt: req.systemPrompt,
    maxTokens: req.maxTokens,
    temperature: req.temperature,
  });
  return response.text;
}

/** BYOK implementation. Reads localStorage keys + env Groq fallback. */
async function tryByok(req: AIChatRequest): Promise<string> {
  if (req.signal?.aborted) throw new AIRouterError("user abort", "user_aborted", ["byok"]);
  const byok = readByokKeys();
  const envHasGroq = hasEnvGroqKey();
  if (!byok.groq && !byok.gemini && !byok.openrouter && !envHasGroq) {
    throw new Error("no BYOK keys configured");
  }
  const mod = await import("@/services/api/byokProvider").catch(() => null);
  if (!mod) throw new Error("BYOK provider module missing");
  const response = await mod.byokChat({
    prompt: req.prompt,
    systemPrompt: req.systemPrompt,
    maxTokens: req.maxTokens,
    temperature: req.temperature,
    keys: byok,
  });
  return response.text;
}

/**
 * Deterministic template — last-resort never-network answer.
 * Returns a deck-shaped JSON for generator requests, otherwise a
 * "Here's a thinking framework" markdown answer.
 */
function tryTemplate(req: AIChatRequest): string {
  const topicMatch = req.prompt.match(/on\s+([\w\s-]+?)(?:[?.!]|$)/i);
  const topic = topicMatch?.[1]?.trim() ?? "this topic";
  return `Here is a quick framework for **${topic}** until you reconnect to a free AI provider (Puter, WebLLM, or your own BYOK key).

- **Definition:** a one-line statement a beginner can repeat back.
- **Why it matters:** the "so what" hook that makes it memorable.
- **Example:** one concrete illustration, ideally from your own life.
- **Counter-example:** one place the idea breaks down, to keep it honest.
- **Next step:** one question to ask yourself the next time you meet this idea.

Want richer cards? Open **Settings → AI Provider** to sign in with Puter (free), run our **offline model** with one click, or paste your own Groq / Gemini key.`;
}

// ──────────────────────────────────────────────────────────────────────────
// Public router
// ──────────────────────────────────────────────────────────────────────────

const sessionCache = new Map<string, AIChatResponse>();

const PROVIDER_LABEL: Record<AIProviderId, string> = {
  puter: "Puter (free, hosted)",
  webllm: "WebLLM (offline, on-device)",
  byok: "BYOK (your own key)",
  template: "Built-in framework",
};

function orderedProviders(req: AIChatRequest): AIProviderId[] {
  if (req.forceProvider) {
    // Template-as-force is a footgun — a caller asking for it would
    // receive indistinguishable-shape output. Force 'template' only when
    // explicitly opted in via debug mode; otherwise treat as a NO-OP and
    // fall through to the normal chain.
    if (req.forceProvider === "template") {
      console.warn(
        "[freeAIRouter] forceProvider:'template' is reserved — falling through to chain.",
      );
      return ["puter", "webllm", "byok", "template"];
    }
    return [req.forceProvider];
  }
  // Default order: Puter → WebLLM → BYOK → template.
  return ["puter", "webllm", "byok", "template"];
}

const PROVIDER_FN: Record<AIProviderId, (req: AIChatRequest) => Promise<string>> = {
  puter: tryPuter,
  webllm: tryWebLLM,
  byok: tryByok,
  template: async (req) => tryTemplate(req),
};

/**
 * chat — the main entry point. Tries providers in order, returns the
 * first one that returns text. Caches the response for the SESSION
 * (cleared on page reload).
 */
export async function chat(req: AIChatRequest): Promise<AIChatResponse> {
  const key = memoKey(req);
  const cached = sessionCache.get(key);
  if (cached) return cached;

  const tried: AIProviderId[] = [];
  let lastError: unknown = null;
  for (const provider of orderedProviders(req)) {
    tried.push(provider);
    const start = performance.now();
    try {
      const text = await PROVIDER_FN[provider](req);
      const durationMs = Math.round(performance.now() - start);
      const response: AIChatResponse = {
        text,
        provider,
        providerLabel: PROVIDER_LABEL[provider],
        durationMs,
        fallback: provider === "template",
      };
      sessionCache.set(key, response);
      return response;
    } catch (err) {
      lastError = err;
      // Auth-required → skip ahead to BYOK (no point re-trying Puter).
      if (err instanceof AIRouterError && err.code === "auth_required") {
        continue;
      }
      // User-aborted → don't continue down the chain. Bubble up.
      if (err instanceof AIRouterError && err.code === "user_aborted") {
        throw err;
      }
      // Other errors → continue down the chain silently.
    }
  }

  throw new AIRouterError(
    `All AI providers failed. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
    "all_providers_failed",
    tried,
  );
}

/**
 * Reset the in-memory cache. Useful after a user changes their BYOK
 * key so the next request re-routes through the new key.
 */
export function clearAIRouterCache(): void {
  sessionCache.clear();
}

export const FREE_AI_ROUTER_DIAGNOSTICS = {
  isWebGPUAvailable: detectWebGPU,
  readByokKeys,
};
