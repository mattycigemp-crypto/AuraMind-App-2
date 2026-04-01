import * as path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
      proxy: {
        '/local-ai': {
          target: env.VITE_AI_BASE_URL || 'http://localhost:1234',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/local-ai/, ''),
        },
      },
    },
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY),
      'process.env.VITE_GROQ_API_KEY': JSON.stringify(env.VITE_GROQ_API_KEY),
      'process.env.VITE_OLLAMA_URL': JSON.stringify(env.VITE_OLLAMA_URL),
      'process.env.VITE_USE_LOCAL_AI': JSON.stringify(env.VITE_USE_LOCAL_AI),
      'process.env.VITE_AI_MODEL': JSON.stringify(env.VITE_AI_MODEL),
      'process.env.VITE_AI_BASE_URL': JSON.stringify(env.VITE_AI_BASE_URL),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
