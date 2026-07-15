import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.auramind.app',
  appName: 'AuraMind',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#09090b',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_auramind',
      iconColor: '#a855f7',
      sound: 'default',
    },
    Haptics: {},
    Share: {},
    Clipboard: {},
    Device: {},
    Network: {},
    Preferences: {
      group: 'auramind_prefs',
    },
    Filesystem: {},
    App: {
      launchAutoHide: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#09090b',
    overrideUserAgent: 'AuraMind/2.0.0',
    buildOptions: {
      keystorePath: 'android/keystore/debug.keystore',
      keystoreAlias: 'androiddebugkey',
      keystorePassword: 'android',
      keyPassword: 'android',
    },
  },
};

export default config;