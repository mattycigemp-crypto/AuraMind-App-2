import { useMemo, useState, useEffect } from 'react';

/** Custom event dispatched by AdminFeatureFlags when flags are saved — import this to dispatch/listen */
export const FLAGS_CHANGED_EVENT = 'auramind-flags-changed' as const;

/**
 * Feature flag shape — mirrors AdminFeatureFlags.tsx's FeatureFlag interface.
 * The admin page is the source of truth; this hook reads from the same localStorage key.
 */
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'ai' | 'study' | 'integrations' | 'social' | 'experimental';
  status: 'live' | 'beta' | 'alpha' | 'deprecated' | 'draft';
  enabled: boolean;
  rollout: number; // 0..100
  audience: 'all' | 'admin' | 'teacher' | 'student' | 'pro' | 'ceo';
  owner: string;
  lastModified: number;
  notes?: string;
}

const STORAGE_KEY = 'auramind-admin-feature-flags-v1';

function loadAllFlags(): FeatureFlag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

/**
 * Deterministic but evenly-distributed hash of a string → number 0..99.
 * Used to decide whether a given user falls within a rollout percentage.
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}

/**
 * Check whether a single feature flag is enabled for the current user.
 *
 * Rules (order of precedence):
 * 1. Flag must exist in localStorage and have `enabled: true`
 * 2. If the flag status is 'deprecated' or 'draft' → false (unless admin overrides)
 * 3. If rollout < 100, check whether the user falls within the rollout % via a
 *    deterministic hash of their user ID
 * 4. If audience is not 'all', the caller should pass `userRole` and `userPlan` to match
 *
 * @param flagKey   - the `key` field from the flag (e.g., 'ai_voice_mode')
 * @param userId    - current user's ID, used for rollout % hashing
 * @param userRole  - current user's role ('admin', 'teacher', etc.) for audience gating
 * @param userPlan  - current user's plan ('Starter', 'Pro', etc.) for audience gating
 * @param isAdmin   - if true, ALL flags are visible (admin override)
 * @returns true if the flag is active for this user
 */
export function isFeatureEnabled(
  flagKey: string,
  userId?: string,
  userRole?: string,
  userPlan?: string,
  isAdmin?: boolean,
): boolean {
  const flags = loadAllFlags();
  const flag = flags.find((f) => f.key === flagKey);
  if (!flag) return false;

  // Admin override — see everything
  if (isAdmin) return true;

  // Not enabled
  if (!flag.enabled) return false;

  // Draft/deprecated are hidden from regular users
  if (flag.status === 'draft' || flag.status === 'deprecated') return false;

  // Audience gating
  if (flag.audience !== 'all') {
    if (flag.audience === 'pro' && userPlan !== 'Pro') return false;
    if (flag.audience === 'admin' && userRole !== 'admin' && userRole !== 'ceo' && userRole !== 'owner') return false;
    if (flag.audience === 'teacher' && userRole !== 'teacher') return false;
    if (flag.audience === 'student' && userRole !== 'student') return false;
    if (flag.audience === 'ceo' && userRole !== 'ceo' && userRole !== 'owner') return false;
  }

  // Rollout % — deterministic hash
  if (flag.rollout < 100 && userId) {
    const bucket = hashUserId(userId);
    if (bucket >= flag.rollout) return false;
  }

  return true;
}

/**
 * React hook: returns whether a feature flag is enabled for the current user.
 * Reads from the same localStorage store that AdminFeatureFlags writes to.
 *
 * @example
 * const aiVoiceEnabled = useFeatureFlag('ai_voice_mode', user?.id, user?.role, user?.plan, user?.isAdmin);
 */
export function useFeatureFlag(
  flagKey: string,
  userId?: string,
  userRole?: string,
  userPlan?: string,
  isAdmin?: boolean,
): boolean {
  // Re-render when flags change in the same tab
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick(n => n + 1);
    window.addEventListener(FLAGS_CHANGED_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(FLAGS_CHANGED_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return useMemo(
    () => isFeatureEnabled(flagKey, userId, userRole, userPlan, isAdmin),
    [flagKey, userId, userRole, userPlan, isAdmin, tick],
  );
}

/**
 * Get the raw flag object (for reading rollout %, status, etc. in UI).
 */
export function getFlag(flagKey: string): FeatureFlag | undefined {
  return loadAllFlags().find((f) => f.key === flagKey);
}

export default useFeatureFlag;
