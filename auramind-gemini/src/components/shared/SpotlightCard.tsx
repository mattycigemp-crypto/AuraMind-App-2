import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SpotlightCardProps {
  className?: string;
  /** Color used at the radial-gradient peak. Defaults to AuraMind's primary purple. */
  color?: string;
  /** Radius of the spotlight as a % of the card width/height. */
  spread?: number;
  /** Optional content rendered inside the overlay layer (typically nothing). */
  children?: React.ReactNode;
}

/**
 * Pointer-tracking radial-gradient overlay, intended to be the LAST child
 * inside a relative-positioned card. Reads `onMouseMove` on its own
 * element (so it does not interfere with sibling mouse handlers on the
 * same card) and writes only to the `background` style — which is a
 * separate CSS property from `transform`, so it can coexist with any
 * framer-motion tilt effect on the parent.
 *
 * Pair usage:
 *
 *   <motion.div className="group relative ...">
 *     ...existing card content...
 *     <SpotlightCard />
 *   </motion.div>
 */
const SpotlightCard: React.FC<SpotlightCardProps> = ({
  className,
  color = 'rgba(168, 85, 247, 0.20)', // primary purple
  spread = 60,
  children,
}) => {
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const prefersReducedMotion = useReducedMotion();

  // Mirror [mx, my] into a single CSS background string. `useTransform`'s
  // multi-input form receives the latest values of every source as an
  // array, which we destructure into the gradient function.
  const background = useTransform([mx, my], ([x, y]) =>
    `radial-gradient(circle at ${x}% ${y}%, ${color}, transparent ${spread}%)`
  );

  // Reduced-motion fallback: skip the cursor tracking entirely and just
  // fade in a static centered spotlight on hover. Honors WCAG 2.3.3.
  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          className
        )}
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent ${spread}%)` }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      onMouseMove={({ clientX, clientY, currentTarget }) => {
        const rect = currentTarget.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        mx.set(((clientX - rect.left) / rect.width) * 100);
        my.set(((clientY - rect.top) / rect.height) * 100);
      }}
      style={{ background }}
      aria-hidden
      className={cn(
        'absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export default SpotlightCard;
