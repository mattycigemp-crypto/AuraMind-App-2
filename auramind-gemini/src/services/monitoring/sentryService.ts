import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const ENV = import.meta.env.MODE || 'development';

export function initSentry(): void {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: ENV === 'production' ? 0.25 : 1.0,
  });
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!SENTRY_DSN) return;
  Sentry.captureMessage(message, level);
}

export { Sentry };
export default Sentry;
