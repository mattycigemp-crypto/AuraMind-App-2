/**
 * useFirstTuneReveal — localStorage-backed "first-tune" gate.
 *
 * The Personalized FSRS Feature used to be invisible: when the tuner finally
 * produced beat-defaults weights for the first time, nothing happened on
 * screen. This hook surfaces that moment, but only once per browser. After
 * the user dismisses the reveal (or 12h pass with no interaction) the flag
 * sticks and the hook never returns `shouldShow: true` again for that user.
 *
 * SSR-safe — Render returns nothing during the brief `isReady: false` cycle
 * before we've checked localStorage.
 */
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'auramind_first_tune_revealed_v1';

interface RevealState {
  isReady: boolean;
  shouldShow: boolean;
  markShown: () => void;
}

export function useFirstTuneReveal(
  isPersonalized: boolean,
  hasProfile: boolean,
): RevealState {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setSeen(true); // SSR / non-browser context — never show
      return;
    }
    try {
      setSeen(window.localStorage.getItem(STORAGE_KEY) !== null);
    } catch {
      // localStorage can throw in privacy-mode browsers; treat as already
      // revealed so we don't get stuck on a flag we can't persist.
      setSeen(true);
    }
  }, []);

  const markShown = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // privacy mode fallback is fine
    }
    setSeen(true);
  }, []);

  return {
    isReady: seen !== null,
    shouldShow: seen === false && isPersonalized && hasProfile,
    markShown,
  };
}

export default useFirstTuneReveal;
