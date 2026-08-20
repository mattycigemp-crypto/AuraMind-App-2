/**
 * Vercel API Middleware - Security Headers & Rate Limiting
 * 
 * Applied to all API routes to ensure security best practices.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Security headers to apply to all responses
const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.posthog.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.posthog.com https://api.groq.com https://api.stripe.com https://huggingface.co https://cdn-lfs.huggingface.co https://wasm.huggingface.co",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Enable XSS protection
  'X-XSS-Protection': '0', // Modern browsers use CSP instead

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=(self)',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),

  // Strict Transport Security (production only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Cross-Origin policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// Rate limiting configuration
const RATE_LIMITS = {
  default: { max: 100, window: 60 * 1000 }, // 100 requests per minute
  ai: { max: 30, window: 60 * 1000 }, // 30 AI requests per minute
  auth: { max: 10, window: 60 * 1000 }, // 10 auth requests per minute
};

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: VercelRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function checkRateLimit(key: string, max: number, window: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + window };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    const cutoff = now - window;
    for (const [k, v] of rateLimitStore) {
      if (v.resetAt < cutoff) rateLimitStore.delete(k);
    }
  }

  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Apply security headers and rate limiting. Returns true if the request
 * should continue to the handler. Returns false if a response was already
 * sent (OPTIONS preflight or 429 rate limit).
 */
export function applyMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  options?: { rateLimitType?: 'default' | 'ai' | 'auth' }
): boolean {
  // Apply security headers (skip CSP/CORS in Vercel production — vercel.json handles those)
  const isVercel = !!process.env.VERCEL;
  if (!isVercel) {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(header, value);
    }
    // Apply CORS headers only when running standalone (not on Vercel where vercel.json handles it)
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }

  // Rate limiting
  const rateLimitType = options?.rateLimitType || 'default';
  const config = RATE_LIMITS[rateLimitType];
  const clientIp = getClientIp(req);
  const rateLimitKey = `${rateLimitType}:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, config.max, config.window);

  res.setHeader('X-RateLimit-Limit', config.max);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000));

  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds.`,
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
    return false;
  }

  return true;
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error(`[API Error] ${req.method} ${req.url}:`, error);

      // Don't expose internal errors in production
      const isDev = process.env.NODE_ENV === 'development';

      res.status(error.status || 500).json({
        error: error.message || 'Internal server error',
        ...(isDev && { stack: error.stack }),
      });
    }
  };
}
