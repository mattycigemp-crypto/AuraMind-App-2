/**
 * Rate Limiter for Client-Side API Calls
 * 
 * Prevents API abuse and manages quota usage for AI providers.
 * Uses a sliding window algorithm for accurate rate limiting.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  key?: string;
}

interface RateLimitState {
  requests: number[];
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(config: RateLimitConfig) {
  const key = config.key || `rl_${config.maxRequests}_${config.windowMs}`;

  return {
    /**
     * Check if a request is allowed
     * Returns { allowed: boolean, retryAfter?: number, remaining?: number }
     */
    check(): { allowed: boolean; retryAfter?: number; remaining?: number; limit: number } {
      const now = Date.now();
      let state = rateLimitStore.get(key);

      if (!state) {
        state = { requests: [] };
        rateLimitStore.set(key, state);
      }

      // Clean up old requests outside the window
      state.requests = state.requests.filter(time => time > now - config.windowMs);

      // Check if blocked
      if (state.blockedUntil && now < state.blockedUntil) {
        return {
          allowed: false,
          retryAfter: Math.ceil((state.blockedUntil - now) / 1000),
          limit: config.maxRequests,
        };
      }

      // Clear block if window has passed
      if (state.blockedUntil && now >= state.blockedUntil) {
        state.blockedUntil = undefined;
      }

      const remaining = config.maxRequests - state.requests.length;

      if (remaining <= 0) {
        // Block until the oldest request expires from the window
        const oldestRequest = state.requests[0];
        state.blockedUntil = oldestRequest + config.windowMs;
        
        return {
          allowed: false,
          retryAfter: Math.ceil((state.blockedUntil - now) / 1000),
          limit: config.maxRequests,
        };
      }

      return {
        allowed: true,
        remaining,
        limit: config.maxRequests,
      };
    },

    /**
     * Record a request
     */
    record(): void {
      const now = Date.now();
      let state = rateLimitStore.get(key);

      if (!state) {
        state = { requests: [] };
        rateLimitStore.set(key, state);
      }

      state.requests.push(now);
    },

    /**
     * Reset the rate limiter
     */
    reset(): void {
      rateLimitStore.delete(key);
    },

    /**
     * Get current state
     */
    getState(): RateLimitState {
      return rateLimitStore.get(key) || { requests: [] };
    },
  };
}

// Pre-configured rate limiters for different API types
export const aiRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 30 requests per minute
  key: 'ai_api',
});

export const cardOperationLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 100 card operations per minute
  key: 'card_ops',
});

export const importLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 5 imports per minute
  key: 'imports',
});

export const exportLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 10 exports per minute
  key: 'exports',
});

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  public retryAfter: number;
  public limit: number;

  constructor(retryAfter: number, limit: number) {
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
  }
}

/**
 * Wrap an async function with rate limiting
 */
export async function withRateLimit<T>(
  limiter: ReturnType<typeof createRateLimiter>,
  fn: () => Promise<T>
): Promise<T> {
  const result = limiter.check();

  if (!result.allowed) {
    throw new RateLimitError(result.retryAfter!, result.limit);
  }

  limiter.record();
  return fn();
}

/**
 * Get rate limit status for all limiters
 */
export function getRateLimitStatus(): Record<string, { used: number; limit: number; remaining: number }> {
  const status: Record<string, any> = {};

  const limiters = [
    { name: 'ai_api', limiter: aiRateLimiter, max: 30 },
    { name: 'card_ops', limiter: cardOperationLimiter, max: 100 },
    { name: 'imports', limiter: importLimiter, max: 5 },
    { name: 'exports', limiter: exportLimiter, max: 10 },
  ];

  for (const { name, limiter, max } of limiters) {
    const state = limiter.getState();
    const used = state.requests.length;
    status[name] = {
      used,
      limit: max,
      remaining: Math.max(0, max - used),
    };
  }

  return status;
}



