import { useState, useEffect } from 'react';

const DEVTOOLS_KEY = 'auramind.devtools.v1';

export function useDevToolsToggle() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(DEVTOOLS_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setEnabled(prev => {
          const next = !prev;
          try { localStorage.setItem(DEVTOOLS_KEY, String(next)); } catch {}
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return enabled;
}
