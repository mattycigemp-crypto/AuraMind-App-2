/**
 * useReducedMotion
 *
 * React hook that returns whether the user prefers reduced motion.
 *
 * Subscribes to the media-query so flipping the OS preference (Settings → Accessibility)
 * instantly reflects in every consumer without re-mounts.
 *
 * Re-export of Motion's native hook with an SSR-safe fallback. Used everywhere we need to
 * gate a framer-motion variant or a canvas-confetti burst.
 */
import { useEffect, useState } from 'react';
import { useReducedMotion as motionUseReducedMotion } from 'motion/react';

/**
 * Standalone hook — use this when motion/react isn't imported yet.
 * Returns true / false based on the current prefers-reduced-motion: reduce setting.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    // Modern browsers support addEventListener; Safari < 14 needs deprecated addListener.
    if ('addEventListener' in mq) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    (mq as any).addListener(onChange);
    return () => (mq as any).removeListener(onChange);
  }, []);

  return reduced;
}

/**
 * Composed hook — prefers Motion's useReducedMotion (already reactive in tests)
 * and falls back to our standalone impl when Motion is unavailable.
 */
export function useReducedMotionSafe(): boolean {
  try {
    return motionUseReducedMotion() ?? false;
  } catch {
    return usePrefersReducedMotion();
  }
}

// Default export is the safe one — prefer that everywhere.
export default usePrefersReducedMotion;
