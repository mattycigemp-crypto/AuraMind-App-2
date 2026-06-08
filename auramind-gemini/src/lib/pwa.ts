import { VitePWA } from 'vite-plugin-pwa';

/**
 * PWA Configuration for AuraMind
 * 
 * Enables offline studying, installability, and push notifications.
 * Key features:
 * - Offline flashcard review (cached decks and cards)
 * - Install as native app on mobile/desktop
 * - Background sync for study progress
 * - Push notifications for review reminders
 */
export const pwaConfig = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'AuraMind - AI Study Companion',
    short_name: 'AuraMind',
    description: 'AI-powered flashcards with spaced repetition for efficient learning',
    theme_color: '#0a0a0a',
    background_color: '#0a0a0a',
    display: 'standalone',
    orientation: 'any',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['education', 'productivity'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: false,
  },
  workbox: {
    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB (WebLLM bundle is ~8MB)
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    
    // Cache strategies for different resources
    runtimeCaching: [
      // Supabase API - network first, fallback to cache
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      
      // AI API calls - network only (don't cache AI responses)
      {
        urlPattern: /^https:\/\/api\.groq\.com\/.*/i,
        handler: 'NetworkOnly',
      },
      
      // Static assets - cache first
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      
      // Fonts - cache first
      {
        urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts-cache',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      
      // Google Fonts
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
  
// Development mode settings
devOptions: {
  enabled: false, // Disable PWA in development to avoid HMR issues
  type: 'module',
},
});



