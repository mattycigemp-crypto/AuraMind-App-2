/// <reference types="vitest" />
import * as path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { pwaConfig } from './src/lib/pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      host: isProd ? '0.0.0.0' : 'localhost',
      allowedHosts: true,
      hmr: {
        overlay: true,
      },
      proxy: {
        '/local-ai': {
          target: env.VITE_AI_BASE_URL || 'http://localhost:1234',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/local-ai/, ''),
        },
        ...(env.VITE_API_PROXY_TARGET ? {
          '/api': {
            target: env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
          },
        } : {}),
      },
    },
    plugins: [
      react(),
      pwaConfig,
    ],

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Only collect Vitest unit tests from src/. Without an explicit
      // include, Vitest also picks up the Playwright specs in e2e/ and
      // fails to collect them (`test.describe()` is not a Vitest API).
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'e2e', 'api/node_modules'],
    },

    build: {
      rollupOptions: {
        plugins: [...(isProd ? [visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        })] : [])],
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-charts': ['recharts'],
            'vendor-radix': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-context-menu', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
            'vendor-picker': ['react-day-picker'],
            'vendor-animejs': ['animejs'],
            // Sentry ships its whole browser SDK into whatever chunk first
            // touches it; isolating it keeps the entry chunk cacheable
            // across releases instead of invalidating on every app change.
            'vendor-sentry': ['@sentry/react'],
            'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
            'vendor-katex': ['katex', 'react-katex'],
            'vendor-pdfjs': ['pdfjs-dist'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'analytics': ['posthog-js'],
          },
        },
      },
      chunkSizeWarningLimit: 700,
    },
    optimizeDeps: {
      exclude: ['posthog-js'],
    },
  };
});
