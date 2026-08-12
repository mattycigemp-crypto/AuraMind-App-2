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
          // Function form: the object form matches only a handful of entry
          // ids, so React 19's deep CJS build (react-dom/cjs/react-dom-client
          // .production.js, ~200 kB minified) silently fell into the entry
          // chunk, defeating the cache-partitioning below. Bucketing by path
          // segment keeps every module of a package in its vendor chunk.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/](react|react-dom)([\\/]|$)/.test(id)) return 'vendor-react';
            if (id.includes('react-router-dom')) return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('react-day-picker')) return 'vendor-picker';
            if (id.includes('animejs')) return 'vendor-animejs';
            // Sentry ships its whole browser SDK into whatever chunk first
            // touches it; isolating it keeps the entry chunk cacheable
            // across releases instead of invalidating on every app change.
            if (id.includes('@sentry')) return 'vendor-sentry';
            if (id.includes('i18next')) return 'vendor-i18n';
            if (id.includes('react-markdown') || id.includes('remark-gfm')) return 'vendor-markdown';
            if (id.includes('katex')) return 'vendor-katex';
            if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('posthog-js')) return 'analytics';
            // Heavy runtimes that are only ever dynamic-imported. Naming them
            // keeps them out of the shared chunk (the entry graph can
            // otherwise fold dynamic imports into the shared chunk).
            if (id.includes('@mlc-ai/web-llm')) return 'vendor-webllm';
            if (id.includes('@heyputer/puter.js')) return 'vendor-puter';
            return undefined;
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
