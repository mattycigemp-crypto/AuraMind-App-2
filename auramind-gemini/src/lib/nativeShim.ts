/**
 * Web-only build. Capacitor/Tauri natives are archived (Option A: web PWA);
 * this shim keeps the native API surfaces intact so existing guards resolve
 * to no-ops on web instead of crashing at import time.
 */

type ShimFn = (...args: unknown[]) => Promise<unknown>;
type ShimListener = { remove: () => void };

export function isTauri(): boolean {
  return false;
}

export const Capacitor = {
  getPlatform: (): string => 'web',
  isNativePlatform: (): boolean => false,
};

export enum ImpactStyle {
  Light = 0,
  Medium = 1,
  Heavy = 2,
}
export enum NotificationType {
  None = 0,
  Success = 1,
  Warning = 2,
  Error = 3,
}
export enum Style {
  Dark = 0,
  Light = 1,
  Default = 2,
}
export enum Directory {
  Data = 0,
  Documents = 1,
  External = 2,
}

const noop: ShimFn = async (..._args: unknown[]) => undefined;
const emptyListener: ShimListener = { remove: () => undefined };
const addListenerStub = async (..._args: unknown[]): Promise<ShimListener> => emptyListener;

export const Haptics = {
  impact: noop,
  selectionStart: noop,
  notification: noop,
};

export const PushNotifications = {
  requestPermissions: async (..._args: unknown[]) => ({ receive: 'denied' }),
  register: noop,
  addListener: addListenerStub,
  removeAllListeners: noop,
};

export const LocalNotifications = {
  schedule: noop,
  cancel: noop,
  getPending: async (..._args: unknown[]) => ({ notifications: [] }),
};

export const App = {
  getInfo: async (..._args: unknown[]) => ({ name: 'AuraMind', id: '', build: '', version: '2.0.0' }),
  addListener: addListenerStub,
  removeAllListeners: noop,
};

export const Device = {
  getInfo: async (..._args: unknown[]) => ({ model: '', osVersion: '', platform: 'web', manufacturer: '', memUsed: 0, diskFree: 0, diskTotal: 0, webViewVersion: '' }),
};

export const Network = {
  getStatus: async (..._args: unknown[]) => ({ connected: false, connectionType: 'unknown' }),
  addListener: addListenerStub,
};

export const Preferences = {
  get: async (..._args: unknown[]) => ({ value: null }),
  set: noop,
  remove: noop,
  clear: noop,
};

export const Filesystem = {
  readFile: async (..._args: unknown[]) => ({ data: '' }),
  writeFile: noop,
  deleteFile: noop,
  readdir: async (..._args: unknown[]) => ({ files: [] }),
};

export const Share = { share: noop };

export const Clipboard = {
  write: noop,
  read: async (..._args: unknown[]) => ({ value: '' }),
};

export const StatusBar = {
  setStyle: noop,
  setBackgroundColor: noop,
  show: noop,
  hide: noop,
};

export const SplashScreen = { hide: noop, show: noop };

export const Keyboard = {
  addListener: addListenerStub,
  setResizeMode: noop,
};

export const NativeBiometric = {
  isAvailable: async (..._args: unknown[]) => ({ isAvailable: false }),
  verifyIdentity: noop,
  setCredentials: noop,
  getCredentials: async (..._args: unknown[]) => null,
  deleteCredentials: noop,
};

export const getVersion = async (): Promise<string> => '2.0.0';
export const getName = async (): Promise<string> => 'AuraMind';
export const check = async (): Promise<{ version: string; body?: string } | null> => null;
