import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the AuraMind Android (and future iOS) app.
 *
 * - appId is fixed forever: `com.auramind.app`. Changing it after the first
 *   Play Store upload makes the store treat the app as a brand-new package.
 * - webDir points at the Vite production build output (`npm run build`).
 * - Traffic is HTTPS-only via the `https` androidScheme; cleartext is NOT
 *   enabled so release builds reject plain HTTP.
 */
const config: CapacitorConfig = {
  appId: 'com.auramind.app',
  appName: 'AuraMind',
  webDir: 'dist',
  backgroundColor: '#0a0a0a',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    App: {
      launchAutoHide: true,
    },
  },
};

export default config;
