import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

declare global {
  interface Window {
    __TAURI__?: any;
    Capacitor?: any;
  }
}

async function initApp() {
  const container = document.getElementById('root');
  if (!container) return;

  const root = createRoot(container);
  
  // Initialize native platforms if available
  if (typeof window !== 'undefined') {
    // Check for Tauri
    if (window.__TAURI__) {
      document.documentElement.classList.add('tauri-app');
    }
    
    // Check for Capacitor
    if (window.Capacitor) {
      document.documentElement.classList.add('capacitor-app');
      
      // Add platform class
      const platform = window.Capacitor.getPlatform();
      document.documentElement.classList.add(`platform-${platform}`);
      
      if (platform === 'ios') {
        document.documentElement.classList.add('ios-app');
      } else if (platform === 'android') {
        document.documentElement.classList.add('android-app');
      }
    }
  }

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

initApp();