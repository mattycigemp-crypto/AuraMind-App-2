import React, { useState, useEffect } from 'react';
import { XIcon as X, Settings2Icon as Settings, CheckIcon as Check } from '../icons/CustomIcons';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_KEY = 'auramind-cookie-consent';
const COOKIE_PREFS_KEY = 'auramind-cookie-preferences';

const DEFAULT_PREFS: CookiePreferences = {
  necessary: true, // Always true, cannot be disabled
  analytics: false,
  marketing: false,
  preferences: false,
};

export function CookieConsentBanner(): React.ReactElement | null {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFS);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      setShowBanner(true);
    } else {
      // Load saved preferences
      try {
        const prefs = localStorage.getItem(COOKIE_PREFS_KEY);
        if (prefs) {
          setPreferences(JSON.parse(prefs));
        }
      } catch {
        // Invalid data, use defaults
      }
    }
  }, []);

  const handleAccept = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));
    setShowBanner(false);
    setShowPreferences(false);

    // Apply preferences
    applyCookiePreferences(prefs);
  };

  const handleDecline = () => {
    handleAccept({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  if (!showBanner && !showPreferences) return null;

  if (showPreferences) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="max-w-lg mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Cookie Preferences</h3>
            <button
              onClick={() => setShowPreferences(false)}
              className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <CookieToggle
              label="Necessary"
              description="Required for the app to function. Cannot be disabled."
              checked={true}
              disabled={true}
            />
            <CookieToggle
              label="Analytics"
              description="Help us understand how you use the app to improve your experience."
              checked={preferences.analytics}
              onChange={(v) => setPreferences(prev => ({ ...prev, analytics: v }))}
            />
            <CookieToggle
              label="Marketing"
              description="Used to deliver relevant content and offers."
              checked={preferences.marketing}
              onChange={(v) => setPreferences(prev => ({ ...prev, marketing: v }))}
            />
            <CookieToggle
              label="Preferences"
              description="Remember your settings and preferences."
              checked={preferences.preferences}
              onChange={(v) => setPreferences(prev => ({ ...prev, preferences: v }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(preferences)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Check className="h-4 w-4" />
              Save Preferences
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors text-sm"
            >
              Decline All
            </button>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            You can change your cookie preferences at any time in Settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-lg mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">We use cookies</h3>
        <p className="text-sm text-zinc-400 mb-4">
          We use cookies to enhance your experience, analyze traffic, and for marketing purposes.
          You can customize your preferences or accept all. Read our{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors text-sm"
          >
            <Settings className="h-4 w-4" />
            Customize
          </button>
          <button
            onClick={handleDecline}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors text-sm"
          >
            Decline
          </button>
          <button
            onClick={() => handleAccept({ ...DEFAULT_PREFS, analytics: true, preferences: true })}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-3">
      <button
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
          checked
            ? 'bg-primary border-primary'
            : 'border-zinc-600 bg-zinc-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </button>
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

/**
 * Apply cookie preferences to analytics and tracking
 */
async function applyCookiePreferences(prefs: CookiePreferences): Promise<void> {
  const { getPostHog } = await import('../../services/analytics/analyticsService');
  const posthog = await getPostHog();
  if (!posthog) return;

  if (!prefs.analytics) {
    posthog.opt_out_capturing();
  } else {
    posthog.opt_in_capturing();
  }
}

/**
 * Check if a cookie category is allowed
 */
export function isCookieAllowed(category: keyof CookiePreferences): boolean {
  if (typeof window === 'undefined') return false;
  if (category === 'necessary') return true;

  const consent = localStorage.getItem(COOKIE_KEY);
  if (!consent) return false;

  try {
    const prefs = localStorage.getItem(COOKIE_PREFS_KEY);
    if (prefs) {
      return JSON.parse(prefs)[category] === true;
    }
  } catch {
    // Invalid data
  }

  return false;
}



