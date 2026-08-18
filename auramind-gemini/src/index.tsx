import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/platform-styles.css';

// Environment validation
import { validateEnv, logEnvValidation } from './lib/env';

// Error handling
import { ErrorBoundary, setupGlobalErrorHandler } from './components/shared/ErrorBoundary';

// SEO
import { updateMetaTags, setDefaultJsonLd } from './lib/seo';

// Crash reporting
import { initSentry } from './services/monitoring/sentryService';

// Offline support
import { isOnline, onConnectionChange, syncOfflineData } from './services/offline/offlineStudyService';
import { getAppPreference } from './lib/appPreferences';

// Data layer
import { QueryClientProvider } from '@tanstack/react-query';
// React Query Devtools — strictly opt-in.
//
// Why so heavily gated:
//   - The floating button sits at bottom-left by default and visually
//     competes with page-level CTAs and section badges (it ate the
//     comparison table's "THIS ONE" pill in early QA passes).
//   - Dev mode isn't enough of a signal: `npm run dev` is used for
//     marketing screenshots, preview links, and demos — none of which
//     should carry a debug surface.
//   - Production builds must NEVER include the devtools (stripped by
//     tree-shaking thanks to the env-conditional import).
//
// To re-enable for cache debugging, add `VITE_RQ_DEVTOOLS=true` to
// `.env.local` and restart the dev server. The button then appears at
// bottom-left, intentionally, so QA notes in screenshots reveal cache
// state — NOT a default.
const ReactQueryDevtools =
  import.meta.env.DEV && import.meta.env.VITE_RQ_DEVTOOLS === 'true'
    ? React.lazy(() =>
        import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
      )
    : null;
import { queryClient } from './lib/queryClient';

// Initialize Sentry (no-op if DSN not configured)
initSentry();

// Validate environment at startup
const envResult = validateEnv();
logEnvValidation(envResult);

// Register PWA Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        console.warn('[PWA] New content available, need refresh');
      },
      onOfflineReady() {
        console.warn('[PWA] Offline ready');
      },
    });
  }).catch(err => console.error('[PWA] Registration failed', err));
}

// Set up global error handlers
setupGlobalErrorHandler();

// Initialize SEO meta tags
updateMetaTags();
setDefaultJsonLd();

// Connection status monitoring
let isCurrentlyOnline = isOnline();
onConnectionChange(
  () => {
    isCurrentlyOnline = true;
    console.warn('[Network] Connection restored');
    const autoSync = getAppPreference('auramind_autoSync', true);
    if (!autoSync) return;
    syncOfflineData().then(result => {
      if (result.synced > 0) {
        console.warn(`[Sync] Synced offline items (${result.synced} succeeded, ${result.failed} failed)`);
      }
    });
  },
  () => {
    isCurrentlyOnline = false;
    console.warn('[Network] Connection lost - offline mode active');
  }
);

// Expose connection status globally
(window as any).__AURAMIND_ONLINE__ = () => isCurrentlyOnline;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        {ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);



