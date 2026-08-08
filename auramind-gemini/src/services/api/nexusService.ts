// ═══════════════════════════════════════════════════════════
// Nexus Service — Real API calls for the Nexus Command dashboard
// CEO/Owner only. Powers: Crypto, Market Intel, AI Agent,
// Dark Web Monitor, Predictive Models
// ═══════════════════════════════════════════════════════════
import { groqChat } from './groqClient';

/**
 * True when VITE_GROQ_API_KEY is set to a real-looking key. Centralises the
 * dev-UX guard that's repeated in fetchMarketIntel (×2), runAIAgent, and
 * generatePredictions — each does the same `'gsk_your_key_here'` check.
 *
 * Without this guard, dev boxes carrying the starter `.env` placeholder
 * would leak a `Groq API error (401): Invalid API Key` from groqChat's
 * fetch into `runAIAgent`'s step ticker via `addStep(\`Error: ${err.message}\`).
 * `fetchMarketIntel`'s and `generatePredictions`'s `try/catch` blocks already
 * silently swallow the throw, so they don't surface the raw error — but
 * returning the fallback message here is friendlier across the whole Nexus
 * surface, not just the agent step ticker.
 *
 * Replace with a centralised env validator (extend `src/lib/env.ts`) once
 * dev onboarding ships real keys by default.
 *
 * Exported as a test seam so `__tests__/nexusServiceGroqKey.test.ts` can
 * stub `VITE_GROQ_API_KEY` and assert that a future "cleanup dead-looking
 * checks" pass can't silently regress this guard.
 */
export function _hasRealGroqKey(): boolean {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  return !!key && key !== 'gsk_your_key_here';
}

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: string;
}

interface MarketIntelResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
  }>;
  summary: string;
  searchedAt: number;
}

interface AIAgentResult {
  prompt: string;
  result: string;
  steps: string[];
  completedAt: number;
}

interface BreachResult {
  email: string;
  breached: boolean;
  breaches: string[];
  count: number;
}

interface PredictionResult {
  asset: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  catalyst: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  generatedAt: number;
}

// ────────────────────────────────────────────────────────
// CoinGecko — Free Crypto Prices (no API key needed)
// ────────────────────────────────────────────────────────

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const CRYPTO_MAP: Record<string, { id: string; name: string }> = {
  BTC: { id: 'bitcoin', name: 'Bitcoin' },
  ETH: { id: 'ethereum', name: 'Ethereum' },
  SOL: { id: 'solana', name: 'Solana' },
  ARB: { id: 'arbitrum', name: 'Arbitrum' },
  AAVE: { id: 'aave', name: 'Aave' },
};

let cryptoCache: { data: CryptoPrice[]; ts: number } | null = null;
const CRYPTO_CACHE_TTL = 60000; // 1 minute

export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  if (cryptoCache && Date.now() - cryptoCache.ts < CRYPTO_CACHE_TTL) {
    return cryptoCache.data;
  }

  const ids = Object.values(CRYPTO_MAP).map(c => c.id).join(',');
  const symbols = Object.keys(CRYPTO_MAP);

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );

    if (!res.ok) {
      console.warn('CoinGecko API failed, returning cached data');
      return cryptoCache?.data ?? [];
    }

    const raw = await res.json();
    const prices: CryptoPrice[] = symbols.map(sym => {
      const meta = CRYPTO_MAP[sym];
      const data = raw[meta.id] || {};
      return {
        symbol: sym,
        name: meta.name,
        price: data.usd ?? 0,
        change24h: data.usd_24h_change ?? 0,
        marketCap: data.usd_market_cap
          ? formatMarketCap(data.usd_market_cap)
          : 'N/A',
      };
    });

    cryptoCache = { data: prices, ts: Date.now() };
    return prices;
  } catch {
    return cryptoCache?.data ?? [];
  }
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

// ────────────────────────────────────────────────────────
// Google Custom Search + Groq AI — Market Intelligence
// ────────────────────────────────────────────────────────

export async function fetchMarketIntel(query: string): Promise<MarketIntelResult> {
  const searchKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
  const engineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  const results: MarketIntelResult['results'] = [];

  // Try real Google Search
  if (searchKey && engineId && searchKey !== 'your_google_search_api_key') {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${searchKey}&cx=${engineId}&q=${encodeURIComponent(query)}&num=5`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        for (const item of (json.items || [])) {
          const sentiment = await analyzeSentiment(item.snippet || item.title || '');
          results.push({
            title: item.title || 'Untitled',
            url: item.link || '#',
            snippet: item.snippet || '',
            sentiment: sentiment.label,
            sentimentScore: sentiment.score,
          });
        }
      }
    } catch {
      console.warn('Google Search API failed for market intel');
    }
  }

  // Fallback: use Groq AI to generate market intelligence
  if (results.length === 0) {
    if (_hasRealGroqKey()) {
      try {
        const aiSummary = await callGroqAI(
          `You are a competitive intelligence analyst. Research the following topic using your knowledge: "${query}". 
          Return a JSON array of 5 results with: title, url (use real URLs you know), snippet, sentiment (positive/negative/neutral), sentimentScore (-100 to 100).
          Format: [{"title":"...","url":"...","snippet":"...","sentiment":"...","sentimentScore":0}]`
        );
        const parsed = parseAIJson(aiSummary);
        if (Array.isArray(parsed)) {
          results.push(...parsed.slice(0, 5));
        }
      } catch {
        // Groq search synthesis failed — results stay empty rather than fabricated
      }
    }
  }

  // Absolute fallback: no fabricated results — the summary explains the gap.
  let summary = 'Connect Groq API key for AI-powered summaries.';
  if (_hasRealGroqKey()) {
    try {
      summary = await callGroqAI(
        `Summarize these search results about "${query}" in 2-3 sentences for a CEO briefing: ${JSON.stringify(results.slice(0, 3))}`
      );
    } catch {
      summary = 'AI summary unavailable.';
    }
  }

  return { query, results, summary, searchedAt: Date.now() };
}

async function analyzeSentiment(text: string): Promise<{ label: 'positive' | 'negative' | 'neutral'; score: number }> {
  const positiveWords = ['launch', 'growth', 'funding', 'innovation', 'partnership', 'rise', 'breakthrough', 'record', 'surge', 'expansion'];
  const negativeWords = ['layoff', 'decline', 'lawsuit', 'hack', 'breach', 'crash', 'ban', 'fine', 'investigation', 'drop'];
  const lower = text.toLowerCase();
  let score = 0;
  positiveWords.forEach(w => { if (lower.includes(w)) score += 10; });
  negativeWords.forEach(w => { if (lower.includes(w)) score -= 10; });
  const label: 'positive' | 'negative' | 'neutral' = score > 5 ? 'positive' : score < -5 ? 'negative' : 'neutral';
  return { label, score: Math.max(-100, Math.min(100, score * 5)) };
}

// ────────────────────────────────────────────────────────
// Groq AI — Autonomous Agent
// ────────────────────────────────────────────────────────

export async function runAIAgent(prompt: string, onStep?: (step: string) => void): Promise<AIAgentResult> {
  const steps: string[] = [];
  const addStep = (s: string) => { steps.push(s); onStep?.(s); };

  if (!_hasRealGroqKey()) {
    addStep('Warning: No Groq API key configured. Set VITE_GROQ_API_KEY in .env.');
    return { prompt, result: 'Groq API key required for AI agent tasks. Get a free key at https://console.groq.com/keys', steps, completedAt: Date.now() };
  }

  try {
    addStep('Analyzing request and planning research strategy...');

    const researchPlan = await callGroqAI(
      `You are an autonomous AI research agent. Given the task: "${prompt}", create a 4-step research plan. Return ONLY the 4 steps, one per line, no numbering.`
    );
    const planSteps = researchPlan.split('\n').filter(Boolean).slice(0, 4);
    planSteps.forEach(s => addStep(`Planned: ${s.trim()}`));

    for (let i = 0; i < Math.min(planSteps.length, 3); i++) {
      addStep(`Executing step ${i + 1}: ${planSteps[i].trim().slice(0, 60)}...`);

      const stepResult = await callGroqAI(
        `You are executing step ${i + 1} of a research plan for: "${prompt}". 
        Current step: "${planSteps[i]}". 
        Provide a detailed analysis for this step. Include specific data, numbers, and actionable insights. Keep it under 150 words.`
      );

      addStep(`Step ${i + 1} complete: ${stepResult.slice(0, 80)}...`);
    }

    addStep('Compiling final report...');
    const finalReport = await callGroqAI(
      `Synthesize all research findings for the task: "${prompt}". 
      Provide a CEO-ready executive summary with key insights, data points, and actionable recommendations. Be specific and data-driven. Under 200 words.`
    );

    addStep('Report complete.');
    return { prompt, result: finalReport, steps, completedAt: Date.now() };
  } catch (err: any) {
    addStep(`Error: ${err.message}`);
    return { prompt, result: `Agent task failed: ${err.message}`, steps, completedAt: Date.now() };
  }
}

// ────────────────────────────────────────────────────────
// Have I Been Pwned — Breach Check (free, no key)
// ────────────────────────────────────────────────────────

export async function checkBreaches(emails: string[]): Promise<BreachResult[]> {
  const results: BreachResult[] = [];

  for (const email of emails) {
    try {
      const res = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
        headers: { 'hibp-api-key': '' }, // empty key works for basic rate-limited access
      });

      if (res.status === 404) {
        results.push({ email, breached: false, breaches: [], count: 0 });
      } else if (res.ok) {
        const breaches = await res.json();
        results.push({
          email,
          breached: true,
          breaches: breaches.map((b: any) => b.Name || b.Title || 'Unknown breach'),
          count: breaches.length,
        });
      } else if (res.status === 429) {
        // Rate limited — return unknown
        results.push({ email, breached: false, breaches: ['Rate limited — try again later'], count: -1 });
      } else {
        results.push({ email, breached: false, breaches: [], count: 0 });
      }
    } catch {
      results.push({ email, breached: false, breaches: ['API unavailable'], count: -1 });
    }
  }

  return results;
}

// ────────────────────────────────────────────────────────
// Groq AI — Predictive Market Models
// ────────────────────────────────────────────────────────

export async function generatePredictions(assets: string[]): Promise<PredictionResult[]> {
  const predictions: PredictionResult[] = [];

  for (const asset of assets) {
    if (!_hasRealGroqKey()) {
      predictions.push({
        asset,
        prediction: 'Groq API key required for AI predictions. Set VITE_GROQ_API_KEY.',
        confidence: 0,
        timeframe: 'N/A',
        catalyst: 'N/A',
        sentiment: 'neutral',
        generatedAt: Date.now(),
      });
      continue;
    }

    try {
      const response = await callGroqAI(
        `You are a financial analyst AI. For ${asset}, provide a concise market prediction.
        Return JSON: {"prediction":"...","confidence":0-100,"timeframe":"...","catalyst":"...","sentiment":"bullish|bearish|neutral"}
        Base this on known market fundamentals, recent news, and technical indicators. Be specific with price targets if applicable.`
      );

      const parsed = parseAIJson(response);
      if (parsed && typeof parsed === 'object') {
        predictions.push({
          asset,
          prediction: String(parsed.prediction || 'No prediction available'),
          confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
          timeframe: String(parsed.timeframe || '6 months'),
          catalyst: String(parsed.catalyst || 'Market fundamentals'),
          sentiment: ['bullish', 'bearish', 'neutral'].includes(parsed.sentiment)
            ? parsed.sentiment as 'bullish' | 'bearish' | 'neutral'
            : 'neutral',
          generatedAt: Date.now(),
        });
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch {
      predictions.push({
        asset,
        prediction: `Unable to generate prediction for ${asset} at this time.`,
        confidence: 0,
        timeframe: 'N/A',
        catalyst: 'AI model error',
        sentiment: 'neutral',
        generatedAt: Date.now(),
      });
    }
  }

  return predictions;
}

// ────────────────────────────────────────────────────────
// GitHub Secret Scanning (public repos only, no auth)
// ────────────────────────────────────────────────────────

interface GitHubScanResult {
  repo: string;
  findings: Array<{ type: string; path: string; severity: 'high' | 'medium' | 'low' }>;
}

export async function scanGitHubForSecrets(orgName: string): Promise<GitHubScanResult[]> {
  const results: GitHubScanResult[] = [];

  try {
    // Search GitHub code for potential secret patterns in the org's repos
    const queries = [
      `org:${orgName} "API_KEY" OR "api_key" OR "secret" OR "password" OR "token"`,
      `org:${orgName} "-----BEGIN" extension:pem`,
      `org:${orgName} ".env" filename:.env`,
    ];

    for (const q of queries.slice(0, 1)) { // Limit to avoid rate limiting
      const res = await fetch(
        `https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=5`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );

      if (res.ok) {
        const json = await res.json();
        for (const item of (json.items || [])) {
          results.push({
            repo: item.repository?.full_name || 'unknown',
            findings: [{
              type: 'Potential secret exposure',
              path: item.path || 'unknown',
              severity: item.path?.includes('.env') ? 'high' : 'medium',
            }],
          });
        }
      }
    }
  } catch {
    // GitHub API rate-limited or unavailable
  }

  return results;
}

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

// Now delegates to the shared groqClient — picks up the corrected model
// (llama-3.3-70b-versatile, was 404'ing on llama3-8b-8192), the VITE_USE_LOCAL_AI
// toggle that Nexus previously lacked, and max_tokens=4000 which matters
// because runAIAgent composes a 4-step research plan that truncates badly
// at the legacy 500-token cap.
async function callGroqAI(prompt: string): Promise<string> {
  const { content } = await groqChat({ prompt });
  return content;
}

function parseAIJson(text: string): any {
  // Try to extract JSON from AI response
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    try { return JSON.parse(match[1]); } catch { /* malformed fenced block */ }
  }
  const bareMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (bareMatch) {
    try { return JSON.parse(bareMatch[0]); } catch { /* not JSON at all */ }
  }
  return null;
}

// Re-export types
export type {
  CryptoPrice,
  MarketIntelResult,
  AIAgentResult,
  BreachResult,
  PredictionResult,
  GitHubScanResult,
};
