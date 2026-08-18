import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { Device } from '@capacitor/device';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Native capability facade.
 *
 * The web build still uses this same module, but Capacitor's plugin bridges
 * become real Android implementations inside the APK. Every consumer keeps
 * an explicit `Capacitor.isNativePlatform()` guard where a browser fallback
 * is not meaningful, so the website remains safe to run without plugins.
 */
export { Capacitor };
export {
  App,
  Clipboard,
  Device,
  Directory,
  Filesystem,
  Haptics,
  ImpactStyle,
  Keyboard,
  LocalNotifications,
  Network,
  NotificationType,
  Preferences,
  Share,
  SplashScreen,
  StatusBar,
  Style,
};

export function isTauri(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
}

/** Push is intentionally opt-in until Firebase credentials are configured. */
export const PushNotifications = {
  requestPermissions: async (..._args: unknown[]) => ({ receive: 'denied' as 'granted' | 'denied' | 'prompt' }),
  register: async (..._args: unknown[]) => undefined,
  addListener: async (..._args: unknown[]) => ({ remove: () => undefined }),
  removeAllListeners: async (..._args: unknown[]) => undefined,
};

/**
 * Biometric login is kept behind the existing facade until a biometric plugin
 * is selected and configured for the production authentication flow.
 */
export const NativeBiometric = {
  isAvailable: async (..._args: unknown[]) => ({ isAvailable: false }),
  verifyIdentity: async (..._args: unknown[]) => undefined,
  setCredentials: async (..._args: unknown[]) => undefined,
  getCredentials: async (..._args: unknown[]) => null,
  deleteCredentials: async (..._args: unknown[]) => undefined,
};

export async function getVersion(): Promise<string> {
  try {
    const info = await App.getInfo();
    return info.version;
  } catch {
    return '2.0.0';
  }
}

export async function getName(): Promise<string> {
  try {
    const info = await App.getInfo();
    return info.name;
  } catch {
    return 'AuraMind';
  }
}

export async function check(): Promise<{ version: string; body?: string } | null> {
  return null;
}
