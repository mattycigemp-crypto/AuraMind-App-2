/**
 * ReducedMotionGuard
 *
 * Single point of authority for prefers-reduced-motion across the whole app.
 *
 * Wraps the tree in MotionConfig (from motion/react) so every Motion component
 * underneath automatically clamps animation distance/duration to those safe
 * for vestibular-sensitive users, AND wraps with LazyMotion for tree-shaken
 * gesture/layout features (smaller bundle on cold load).
 *
 * Pair this with usePrefersReducedMotion() in any component that uses
 * canvas-confetti, anime.js, or imperative tweens outside of Motion.
 */
import React from 'react';
import { MotionConfig, LazyMotion, domAnimation } from 'motion/react';

interface ReducedMotionGuardProps {
  children: React.ReactNode;
}

const ReducedMotionGuard: React.FC<ReducedMotionGuardProps> = ({ children }) => {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
};

export default ReducedMotionGuard;
