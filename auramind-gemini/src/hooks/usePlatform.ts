import { useState } from 'react'

export type PlatformType = 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'web'
export type DetectedSource = 'tauri' | 'capacitor' | 'ua'

function detectPlatform(): { platform: PlatformType; source: DetectedSource } {
  if (typeof window === 'undefined') return { platform: 'web', source: 'ua' }

  // Priority 1: Tauri OS plugin (most accurate)
  const tauriOS = window.__TAURI_OS_PLUGIN_INTERNALS__?.platform
  if (tauriOS === 'macos') return { platform: 'macos', source: 'tauri' }
  if (tauriOS === 'windows') return { platform: 'windows', source: 'tauri' }
  if (tauriOS === 'linux') return { platform: 'linux', source: 'tauri' }
  if (tauriOS === 'ios') return { platform: 'ios', source: 'tauri' }
  if (tauriOS === 'android') return { platform: 'android', source: 'tauri' }

  // Priority 2: Capacitor
  if (window.Capacitor) {
    const cap = window.Capacitor.getPlatform()
    if (cap === 'ios') return { platform: 'ios', source: 'capacitor' }
    if (cap === 'android') return { platform: 'android', source: 'capacitor' }
    // Capacitor returns 'web' when running in browser
  }

  // Fallback: UA detection
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return { platform: 'ios', source: 'ua' }
  if (/android/i.test(ua)) return { platform: 'android', source: 'ua' }
  if (/Macintosh|MacIntel/.test(ua)) return { platform: 'macos', source: 'ua' }
  if (/Windows NT/.test(ua)) return { platform: 'windows', source: 'ua' }
  if (/Linux/.test(ua)) return { platform: 'linux', source: 'ua' }
  return { platform: 'web', source: 'ua' }
}

const platformNames: Record<PlatformType, string> = {
  ios: 'iOS',
  android: 'Android',
  macos: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
  web: 'Web',
}

const platformAccents: Record<PlatformType, string> = {
  ios: '#007AFF',
  android: '#6750A4',
  macos: '#007AFF',
  windows: '#0078D4',
  linux: '#3584E4',
  web: '#a855f7',
}

export function usePlatform() {
  const [{ platform, source: detectedSource }] = useState(() => detectPlatform())

  return {
    platform,
    source: detectedSource,
    isNative: detectedSource === 'tauri' || detectedSource === 'capacitor',
    isWebApp: detectedSource === 'ua',
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isMacOS: platform === 'macos',
    isWindows: platform === 'windows',
    isLinux: platform === 'linux',
    isWeb: platform === 'web',
    platformName: platformNames[platform],
    accentColor: platformAccents[platform],
  }
}
