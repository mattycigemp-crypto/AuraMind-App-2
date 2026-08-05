/**
 * TextScramble — anime.js v4 `scrambleText` integration.
 *
 * Renders a text element whose characters get progressively "resolved"
 * from a random scramble pool into the final target string. Reads as a
 * Matrix-style decode or a hacker-news typewriter reveal.
 *
 * Use cases in AuraMind:
 *   - Leaderboard rank numbers that scramble into place.
 *   - Onboarding "welcome" text that decodes.
 *   - XP / level-up badge text transitions.
 *   - Tooltip "explainer" lines that reveal.
 *
 * Usage:
 *
 *   <TextScramble duration={1200} trigger={trigger}>
 *     Master your memory
 *   </TextScramble>
 *
 * prefers-reduced-motion: the text is rendered in its final state
 * immediately without any scramble animation.
 */

import { useEffect, useRef, useState } from 'react';
import { animate, scrambleText } from 'animejs';
import { useReducedMotion } from './useReducedMotion';

export interface TextScrambleProps {
  /** Total duration in ms. Default 1200. */
  duration?: number;
  /** Replay the scramble whenever this value changes. */
  trigger?: unknown;
  /** Whether to fire on mount. Default true. */
  autoplay?: boolean;
  /** Custom scramble alphabet. Default: alphanumerics + a few symbols. */
  scrambleChars?: string;
  className?: string;
  children: string;
}

const DEFAULT_SCRAMBLE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export function TextScramble({
  duration = 1200,
  trigger,
  autoplay = true,
  scrambleChars = DEFAULT_SCRAMBLE_CHARS,
  className,
  children,
}: TextScrambleProps) {
  const reduced = useReducedMotion();
  const targetRef = useRef<HTMLSpanElement>(null);
  // Track the resolved length so subsequent re-renders don't double-tween.
  const [resolvedLength, setResolvedLength] = useState(0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    if (reduced) {
      el.textContent = children;
      setResolvedLength(children.length);
      return;
    }

    if (!autoplay) return;

    // scrambleText returns a tween function that, when applied to a
    // textContent-like target, scrambles chars then resolves to the
    // final string. anime.js v4 lets us animate the .textContent of a
    // text node.
    animate(el, {
      // @ts-expect-error anime.js v4 accepts a custom tween function here
      textContent: scrambleText(children, { scrambleChars }),
      duration,
      ease: 'linear',
      onUpdate: () => {
        if (el.textContent) setResolvedLength(el.textContent.length);
      },
    });
  }, [reduced, children, duration, scrambleChars, autoplay, trigger]);

  return (
    <span
      ref={targetRef}
      className={className}
      aria-label={children}
      // Render the original text in the DOM so screen readers see it even
      // while the visual scramble is in flight.
    >
      {children}
    </span>
  );
}
