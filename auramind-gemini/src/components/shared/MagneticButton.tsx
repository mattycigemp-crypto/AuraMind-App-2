import * as React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from 'framer-motion';

// Public prop surface: motion's HTMLMotionProps<'button'> widens `children`
// to include MotionValue<number | string>, which collides badly with our
// reduced-motion plain-button fallback. Narrow `children` to ReactNode at
// the type level so callers see honest autocomplete and the component never
// has to cast at runtime.
type MagneticButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children?: React.ReactNode;
  /** Spring tuning — defaults are tuned for primary CTAs. */
  stiffness?: number;
  damping?: number;
  /** Strength factor: how far the button can be pulled (0-1 of cursor offset, clamped). */
  strength?: number;
  /** Distance (px) from cursor within which the pull is full-strength. */
  range?: number;
};

/**
 * A primary CTA whose X/Y position is gently pulled toward the cursor with
 * a spring. Returns to (0,0) smoothly when the cursor leaves the button.
 * All standard `button` props (onClick, disabled, className, aria-*,
 * children, type, ref) forward naturally via the motion-style HTML button
 * props.
 *
 * Pair usage:
 *
 *   <MagneticButton onClick={() => navigate('/auth')} className="...">
 *     Get Started Free
 *     <ArrowRight />
 *   </MagneticButton>
 *
 * Honors WCAG 2.3.3 — when prefers-reduced-motion is set, the component
 * short-circuits to a plain <button> with no spring pull. Motion-only
 * props (initial, animate, whileHover, drag, layout, etc.) are explicit-
 * destructured and dropped on the floor so React DOM never sees them
 * and never warns about unknown attributes.
 */
const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  (
    {
      stiffness = 200,
      damping = 20,
      strength = 0.25,
      range = 80,
      onMouseMove: externalMove,
      onMouseLeave: externalLeave,
      children,
      ...rest
    },
    forwardedRef
  ) => {
    const innerRef = React.useRef<HTMLButtonElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Merge forwardedRef + innerRef so parents can grab the button while
    // we also read its bounding rect inside the handler. `setRefs` is a
    // callback ref, which is directly assignable to `ref={setRefs}` without
    // casting.
    const setRefs = React.useCallback(
      (el: HTMLButtonElement | null) => {
        innerRef.current = el;
        if (typeof forwardedRef === 'function') {
          forwardedRef(el);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
        }
      },
      [forwardedRef]
    );

    // These four hooks MUST run before the prefers-reduced-motion early
    // return below. `prefersReducedMotion` is reactive — it flips when the
    // user toggles the OS setting mid-session — so calling them after the
    // branch changes the hook count between renders and React throws
    // "Rendered fewer hooks than expected". The spring values are simply
    // left unused on the reduced-motion path.
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness, damping });
    const springY = useSpring(y, { stiffness, damping });

    // WCAG 2.3.3 — honor prefers-reduced-motion by rendering a plain
    // <button> with no spring pull. Strip every framer-motion-only prop
    // from `rest` so React DOM won't warn about unknown attributes.
    // Underscore-prefixed locals are exempt from TypeScript's
    // noUnusedLocals check.
    if (prefersReducedMotion) {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        variants: _variants,
        whileHover: _whileHover,
        whileTap: _whileTap,
        whileFocus: _whileFocus,
        whileDrag: _whileDrag,
        whileInView: _whileInView,
        layout: _layout,
        layoutId: _layoutId,
        layoutDependency: _layoutDependency,
        drag: _drag,
        dragConstraints: _dragConstraints,
        dragControls: _dragControls,
        dragListener: _dragListener,
        dragMomentum: _dragMomentum,
        dragElastic: _dragElastic,
        dragTransition: _dragTransition,
        onAnimationStart: _onAnimationStart,
        onAnimationComplete: _onAnimationComplete,
        onAnimationIteration: _onAnimationIteration,
        onDrag: _onDrag,
        onDragStart: _onDragStart,
        onDragEnd: _onDragEnd,
        onDirectionLock: _onDirectionLock,
        transformTemplate: _transformTemplate,
        transition: _transition,
        ...passableProps
      } = rest;

      // React.createElement sidesteps the i18next-augmented JSX
      // intrinsic children type, which would otherwise force us to
      // fight a TS2322 union (ReactI18NextChildren vs. plain ReactNode).
      // All callers pass standard HTML button props (onClick, className,
      // type, aria-*) — the rest destructure above drops every
      // framer-motion-only prop so React DOM never warns about unknown
      // attributes. `children` is already narrowed to ReactNode at the
      // public type level (see `Omit<HTMLMotionProps<'button'>, 'children'>`).
      return React.createElement(
        'button',
        {
          ref: setRefs,
          onMouseMove: externalMove,
          onMouseLeave: externalLeave,
          ...(passableProps as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>),
        },
        children,
      );
    }

    const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = innerRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        // Clamp the input magnitude so the effect doesn't over-pull when
        // the cursor enters near a corner.
        x.set(Math.max(-range, Math.min(range, dx)) * strength);
        y.set(Math.max(-range, Math.min(range, dy)) * strength);
      }
      externalMove?.(e);
    };

    const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      x.set(0);
      y.set(0);
      externalLeave?.(e);
    };

    return (
      <motion.button
        ref={setRefs}
        style={{ x: springX, y: springY }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        {...rest}
      >
        {children}
      </motion.button>
    );
  }
);

MagneticButton.displayName = 'MagneticButton';

export default MagneticButton;
