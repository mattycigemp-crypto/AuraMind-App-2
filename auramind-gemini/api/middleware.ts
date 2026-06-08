import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logger, generateRequestId } from './lib/logger';
import { AppError } from './lib/errors';

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.posthog.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.posthog.com https://api.groq.com https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
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
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

const RATE_LIMITS = {
  default: { max: 100, window: 60 * 1000 },
  ai: { max: 30, window: 60 * 1000 },
  auth: { max: 10, window: 60 * 1000 },
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: VercelRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    'unknown'
  );
}

function checkRateLimit(key: string, max: number, window: number) {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + window };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

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

export interface MiddlewareContext {
  requestId: string;
}

export function applyMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  options?: { rateLimitType?: 'default' | 'ai' | 'auth' },
): MiddlewareContext {
  const requestId = generateRequestId();

  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(header, value);
  }

  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return { requestId };
  }

  const rateLimitType = options?.rateLimitType || 'default';
  const config = RATE_LIMITS[rateLimitType];
  const clientIp = getClientIp(req);
  const rateLimitKey = `${rateLimitType}:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, config.max, config.window);

  res.setHeader('X-RateLimit-Limit', config.max);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000));

  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded', { requestId, clientIp, rateLimitType });
    res.setHeader('Retry-After', Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
    });
    return { requestId };
  }

  return { requestId };
}

export function withErrorHandler(
  handler: (req: VercelRequest, res: VercelResponse, ctx: MiddlewareContext) => Promise<void>,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const ctx = applyMiddleware(req, res);
    const start = Date.now();

    try {
      await handler(req, res, ctx);

      logger.info('Request completed', {
        requestId: ctx.requestId,
        method: req.method,
        url: req.url,
        duration: Date.now() - start,
      });
    } catch (err: unknown) {
      const duration = Date.now() - start;

      if (err instanceof AppError) {
        logger.warn('Request error', {
          requestId: ctx.requestId,
          method: req.method,
          url: req.url,
          status: err.status,
          code: err.code,
          message: err.message,
          duration,
        });

        res.status(err.status).json({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }

      const error = err as Error;
      logger.error('Unhandled error', {
        requestId: ctx.requestId,
        method: req.method,
        url: req.url,
        message: error.message,
        stack: error.stack,
        duration,
      });

      const isDev = process.env.NODE_ENV === 'development';
      res.status(500).json({
        success: false,
        error: {
          message: isDev ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
          ...(isDev && { stack: error.stack }),
        },
      });
    }
  };
}

export { logger };
