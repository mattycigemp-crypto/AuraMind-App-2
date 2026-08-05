/**
 * PulseHeart — hand-coded animated SVG: pulsing aura meter with EKG line.
 *
 * An organic round-blob "aura meter" — the heart of streak/health widgets.
 * The blob breathes via path morph using two hand-tuned keyframe `d` paths,
 * and an EKG line scribbles across the foreground.
 *
 * Props:
 *  - value: 0..1 — drives EKG line amplitude + blob intensity
 *  - ariaLabel: required
 *  - size: viewport size in px
 */
import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PulseHeartProps {
  value?: number;
  ariaLabel: string;
  size?: number;
  className?: string;
}

// Two morph-compatible blob paths. Same number of vertices (M + 6 C-pairs)
// so path interpolation is smooth.
const BLOB_KEY_A =
  "M 80 30 C 110 30 130 50 130 80 C 130 110 110 130 80 130 C 50 130 30 110 30 80 C 30 50 50 30 80 30 Z";
const BLOB_KEY_B =
  "M 80 28 C 116 36 134 52 130 84 C 126 116 104 132 78 132 C 50 130 26 110 30 76 C 34 46 56 24 80 28 Z";

// EKG segments — flattened amp scaled by `value` then translated to a sagittal line.
// We use a single motion.path with an animated `d` to morph between flat (low value)
// and rippled (high value) waveforms so the wave looks alive at any health %.
function ekgPath(value: number): string {
  // Six control segments forming an EKG-like line, mid-y = 80.
  // The three peak amplitudes scale with value.
  const amp = 14 + value * 22;
  const base = "M 8 80 ";
  const segs = [
    `L 22 80`,
    `L 28 ${80 - amp * 0.3}`,
    `L 34 ${80 + amp * 0.18}`,
    `L 40 80`,
    `L 52 ${80 - amp}`,
    `L 64 ${80 + amp * 1.1}`,
    `L 76 80`,
    `L 88 ${80 - amp * 0.5}`,
    `L 100 ${80 + amp * 0.2}`,
    `L 112 80`,
    `L 128 ${80 - amp * 0.65}`,
    `L 144 80`,
    `L 152 80`,
  ];
  return (base + segs.join(" ")).trim();
}

export const PulseHeart: React.FC<PulseHeartProps> = ({
  value = 0.78,
  ariaLabel,
  size = 200,
  className,
}) => {
  const reducedMotion = useReducedMotion();
  const gradId = useId();
  const haloId = useId();
  const v = Math.max(0, Math.min(1, value));

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 160"
        width={size}
        height={size}
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#7C3AED" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0B0B12" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={haloId} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#F0ABFC" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0B0B12" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer halo that breathes */}
        <motion.circle
          cx={80}
          cy={80}
          r={70}
          fill={`url(#${haloId})`}
          animate={
            reducedMotion
              ? undefined
              : {
                  r: [70, 76, 70],
                  opacity: [0.85, 1, 0.85],
                }
          }
          transition={
            reducedMotion ? undefined : { duration: 1.6, ease: "easeInOut", repeat: Infinity }
          }
        />

        {/* The morphing heart-blob. Same number of bezier handles in both keys. */}
        <motion.path
          d={BLOB_KEY_A}
          fill={`url(#${gradId})`}
          animate={
            reducedMotion
              ? undefined
              : { d: [BLOB_KEY_A, BLOB_KEY_B, BLOB_KEY_A] }
          }
          transition={
            reducedMotion
              ? undefined
              : { duration: 2.4, ease: "easeInOut", repeat: Infinity }
          }
        />

        {/* EKG clip — a horizontal frame the wave scribbles in. */}
        <g clipPath="inset(0 0 0 0)">
          <motion.path
            d={ekgPath(v)}
            stroke="#FFFFFF"
            strokeOpacity={0.85}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
            animate={
              reducedMotion
                ? undefined
                : { d: [ekgPath(v), ekgPath(Math.min(1, v + 0.07)), ekgPath(v)] }
            }
            transition={
              reducedMotion ? undefined : { duration: 1.6, ease: "easeInOut", repeat: Infinity }
            }
          />
          <motion.circle
            cx={8}
            cy={80}
            r={2.4}
            fill="#FFFFFF"
            animate={
              reducedMotion
                ? undefined
                : { cx: [8, 152, 8], opacity: [0, 1, 1, 0] }
            }
            transition={
              reducedMotion ? undefined : { duration: 2.8, ease: "easeInOut", repeat: Infinity }
            }
          />
        </g>
      </svg>
    </div>
  );
};

export default PulseHeart;
