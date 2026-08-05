import React from 'react';
import { createRoot } from 'react-dom/client';
import { isTauri } from './lib/nativeShim';
import App from './App';
import './index.css';
import './lib/registerServices';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
    __TAURI_OS_PLUGIN_INTERNALS__?: {
      eol: string;
      os_type: string;
      platform: string;
      family: string;
      version: string;
      arch: string;
      exe_extension: string;
    };
    Capacitor?: any;
  }
}

function getPlatformFromUA(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/Macintosh|MacIntel/.test(ua) && !/iPhone|iPad/.test(ua)) return 'macos';
  if (/Windows NT/.test(ua)) return 'windows';
  if (/Linux/.test(ua) && !/android/i.test(ua)) return 'linux';
  return 'web';
}

async function initApp() {
  const container = document.getElementById('root');
  if (!container) return;

  const root = createRoot(container);
  
  // Detect platform and set CSS classes for platform-specific visuals
  if (typeof window !== 'undefined') {
    // Priority 1: Tauri OS plugin (most accurate, works in desktop + mobile)
    if (window.__TAURI_OS_PLUGIN_INTERNALS__) {
      const osPlatform = window.__TAURI_OS_PLUGIN_INTERNALS__.platform;
      document.documentElement.classList.add('tauri-app');
      document.documentElement.classList.add(`platform-${osPlatform}`);
    }
    // Priority 2: Tauri without OS plugin (UA fallback will handle)
    else if (isTauri()) {
      document.documentElement.classList.add('tauri-app');
      // Fall through to UA detection below
    }
    
    // Priority 3: Capacitor (iOS/Android/web)
    if (window.Capacitor) {
      document.documentElement.classList.add('capacitor-app');
      const capPlatform = window.Capacitor.getPlatform();
      document.documentElement.classList.add(`platform-${capPlatform}`);
      if (capPlatform === 'ios') {
        document.documentElement.classList.add('ios-app');
      } else if (capPlatform === 'android') {
        document.documentElement.classList.add('android-app');
      }
      return; // Capacitor detection is authoritative—don't override with UA
    }
    
    // Fallback: UA detection (web, Tauri without OS plugin, etc.)
    const uaPlatform = getPlatformFromUA();
    document.documentElement.classList.add(`platform-${uaPlatform}`);
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

initApp();