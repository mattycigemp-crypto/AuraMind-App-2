/**
 * AuroraOrb — hand-coded animated SVG illustration.
 *
 * Visual identity for Prof. Aura across the app. A morphing aurora orb
 * with three concentric breathing rings, a soft gradient core, and four
 * "thought particles" that orbit on staggered sine waves.
 *
 * Use it as the hero in any room that mentions Prof. Aura.
 *
 * Props:
 *  - size: diameter in pixels (default 96)
 *  - intensity: 'subtle' | 'normal' | 'hero' — controls ring scale + glow
 *  - mood: 'gentle' | 'focused' | 'celebrating' — shifts the palette
 *  - ariaLabel: required for screen-reader announcement
 */
import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type AuroraOrbMood = "gentle" | "focused" | "celebrating";
export type AuroraOrbIntensity = "subtle" | "normal" | "hero";

interface AuroraOrbProps {
  size?: number;
  intensity?: AuroraOrbIntensity;
  mood?: AuroraOrbMood;
  ariaLabel: string;
  className?: string;
}

const MOOD_GRADIENT: Record<AuroraOrbMood, { from: string; to: string; ring: string }> = {
  gentle: { from: "#A78BFA", to: "#22D3EE", ring: "#67E8F9" },
  focused: { from: "#7C3AED", to: "#EC4899", ring: "#F0ABFC" },
  celebrating: { from: "#F59E0B", to: "#EC4899", ring: "#FCD34D" },
};

const INTENSITY_RING: Record<AuroraOrbIntensity, number> = {
  subtle: 0,
  normal: 1,
  hero: 2,
};

export const AuroraOrb: React.FC<AuroraOrbProps> = ({
  size = 96,
  intensity = "normal",
  mood = "focused",
  ariaLabel,
  className,
}) => {
  const gradientId = useId();
  const innerGlowId = useId();
  const ringIds = [useId(), useId(), useId()];
  const reducedMotion = useReducedMotion();
  const palette = MOOD_GRADIENT[mood];
  const ringCount = INTENSITY_RING[intensity];

  // Orbit angles — evenly distributed so the four particles form a cross
  // that feels deliberate rather than noisy.
  const orbitAngles = [0, 90, 180, 270];

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* SVG core. 100x100 viewBox so we can scale via container width. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        <defs>
          {/* Paintery aurora gradient */}
          <radialGradient id={gradientId} cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor={palette.from} stopOpacity="0.95" />
            <stop offset="55%" stopColor={palette.to} stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0B0B12" stopOpacity="0" />
          </radialGradient>
          {/* Inner glow — additive bloom */}
          <radialGradient id={innerGlowId} cx="50%" cy="50%" r="40%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          {/* Concentric rings — three gradients so each ring can take its own tint */}
          {ringIds.map((id, i) => (
            <radialGradient key={id} id={id} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.ring} stopOpacity="0.0" />
              <stop offset={70 - i * 6} stopColor={palette.ring} stopOpacity="0.18" />
              <stop offset="100%" stopColor={palette.ring} stopOpacity="0.0" />
            </radialGradient>
          ))}
        </defs>

        {/* Outer breathing rings — staggered phase */}
        {Array.from({ length: ringCount }).map((_, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx="50"
            cy="50"
            r={28 + i * 14}
            fill={`url(#${ringIds[i]})`}
            initial={false}
            animate={
              reducedMotion
                ? { opacity: 0.65 - i * 0.18 }
                : {
                    opacity: [0.15, 0.65 - i * 0.12, 0.15],
                    transform: ["scale(0.94)", "scale(1.06)", "scale(0.94)"],
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: 3.6 + i * 1.4,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: i * 0.4,
                  }
            }
            style={{ transformOrigin: "50px 50px" }}
          />
        ))}

        {/* The orb itself — animated fill, subtle elastic pulse.
            We animate `scale` via transform on a wrapper `<g>` rather than
            animating the SVG `r` attribute directly. framer-motion's
            SVG-attribute animation has a brief window where it can emit
            `undefined` to the DOM, which the browser then logs as a
            `<circle> attribute r: Expected length, "undefined"` warning.
            Wrapping in a `<g>` and animating its transform keeps the
            circle's static `r` immutable on the DOM node. */}
        <motion.g
          animate={
            reducedMotion
              ? undefined
              : { scale: [1, 1.06, 1], opacity: [1, 0.94, 1] }
          }
          transition={
            reducedMotion
              ? undefined
              : { duration: 4.2, ease: "easeInOut", repeat: Infinity }
          }
          style={{ transformOrigin: "50px 50px" }}
        >
          <circle
            cx="50"
            cy="50"
            r="24"
            fill={`url(#${gradientId})`}
          />
        </motion.g>
        {/* Inner bloom */}
        <circle cx="50" cy="50" r="14" fill={`url(#${innerGlowId})`} />

        {/* Orbit particles — phase-staggered.
            Same trick: wrap each particle in a `<g>` translated to its
            orbital start position, then animate the `<g>`'s transform
            instead of the SVG `cx`/`cy` attributes. The `r` animation
            is also moved to a transform-scale on the wrapper so the
            DOM-level circle radius stays immutable. */}
        {!reducedMotion &&
          orbitAngles.map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const r = 42;
            const startX = 50 + Math.cos(rad) * r;
            const startY = 50 + Math.sin(rad) * r;
            return (
              <motion.g
                key={`particle-${angle}`}
                initial={{ opacity: 0.3 }}
                animate={{
                  // Rotate around the orb centre so the particle orbits
                  // in a clean circular path without cx/cy mutation.
                  // No `transformBox: fill-box` — we keep the default
                  // `view-box` so `transformOrigin: 50px 50px` is
                  // interpreted in SVG viewport coordinates (where the
                  // orb centre actually lives). With `fill-box` the
                  // origin would be relative to the particle's own
                  // 3.2 px bounding box, which would make it spin in
                  // place instead of orbiting.
                  rotate: [angle, angle + 360],
                  opacity: [0.3, 0.95, 0.3],
                  scale: [0.9, 1.4, 0.9],
                }}
                transition={{
                  duration: 7 + i * 0.6,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
                style={{
                  transformOrigin: "50px 50px",
                }}
              >
                <circle cx={startX} cy={startY} r={1.6} fill={palette.ring} />
              </motion.g>
            );
          })}
      </svg>
    </div>
  );
};

export default AuroraOrb;
