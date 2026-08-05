import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.auramind.app',
  appName: 'AuraMind',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    // cleartext is ONLY allowed for the bundled dev server via
    // `npx cap run android --livereload`. Production traffic is HTTPS-only;
    // ATS in Info.plist rejects cleartext on iOS, and release Android builds
    // do not enable `usesCleartextTraffic`.
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
    /**
     * Release signing for production AABs is handled in
     * `android/app/build.gradle → signingConfigs.release`, which reads
     * `ANDROID_KEYSTORE_PATH` + passwords from environment variables.
     * Do NOT hardcode production keystore paths here — and do not point at
     * the debug keystore for release builds; that silently signs with the
     * debug cert and Play Store rejects the upload.
     *
     * For development (`npx cap run android`), Capacitor expects
     * `buildOptions.keystorePath` to exist so it can verify the Gradle
     * config during sync. We point it at the debug keystore so dev runs
     * work out of the box; release builds use the gradle config instead.
     */
    buildOptions: {
      keystorePath: 'android/keystore/debug.keystore',
      keystoreAlias: 'androiddebugkey',
      keystorePassword: 'android',
      keyPassword: 'android',
    },
  },
};

export default config;
