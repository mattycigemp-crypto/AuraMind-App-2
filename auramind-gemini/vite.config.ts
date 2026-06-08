import * as path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
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

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-charts': ['recharts'],
            'vendor-radix': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-context-menu', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
            'vendor-picker': ['react-day-picker'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: [],
    },
  };
});
