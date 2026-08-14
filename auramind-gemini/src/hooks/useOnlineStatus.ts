import { useEffect, useState } from 'react';

/**
 * useOnlineStatus — tracks connectivity for the study session.
 *
 * `navigator.onLine` is only a coarse signal: it reports whether the device
 * has *a* network interface, not whether the internet is reachable. That is
 * still the right primitive here — the goal is to tell a commuter entering a
 * tunnel that their reviews are being saved locally, not to guarantee an
 * end-to-end health check.
 *
 * Returns `true` when offline detection is unavailable, so a browser without
 * the API never shows a spurious offline banner.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean'
      ? true
      : navigator.onLine,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Re-read on mount: the device may have changed state between the
    // initial render and the listeners attaching.
    if (typeof navigator?.onLine === 'boolean') setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
