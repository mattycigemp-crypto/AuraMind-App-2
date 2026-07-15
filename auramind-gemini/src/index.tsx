import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Environment validation
import { validateEnv, logEnvValidation } from './lib/env';

// Error handling
import { ErrorBoundary, setupGlobalErrorHandler } from './components/shared/ErrorBoundary';

// SEO
import { updateMetaTags, setDefaultJsonLd } from './lib/seo';

// Crash reporting
import { initSentry } from './services/monitoring/sentryService';

// Offline support
import { isOnline, onConnectionChange } from './services/offline/offlineStudyService';

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
        console.log('[PWA] New content available, need refresh');
      },
      onOfflineReady() {
        console.log('[PWA] Offline ready');
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
    console.log('[Network] Connection restored');
    // TODO: Trigger sync of offline study data
  },
  () => {
    isCurrentlyOnline = false;
    console.log('[Network] Connection lost - offline mode active');
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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);



