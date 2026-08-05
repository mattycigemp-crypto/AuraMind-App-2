/**
 * NeuralBloom — hand-coded animated SVG: morphing neural paths.
 *
 * A central node radiates petal-like neural connections outward. The
 * petals pulse in a sine cycle, the connecting dendrites draw themselves
 * in, and four "spark" particles float along arcing paths.
 *
 * Use this for deep-focus hero states, the "Onboard me" carousel, and
 * anywhere we want the impression of growing intelligence.
 *
 * Props:
 *  - size: container size in px
 *  - ariaLabel: required
 */
import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeuralBloomProps {
  size?: number;
  ariaLabel: string;
  className?: string;
}

export const NeuralBloom: React.FC<NeuralBloomProps> = ({
  size = 220,
  ariaLabel,
  className,
}) => {
  const reducedMotion = useReducedMotion();
  const gradId = useId();

  // Six petals evenly distributed around a center at (100,100), radius 60.
  const petals = Array.from({ length: 6 }).map((_, i) => {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = 100 + Math.cos(angle) * 60;
    const y = 100 + Math.sin(angle) * 60;
    return { x, y, angle, key: i };
  });

  // Four spark paths — different arcs.
  const sparks = [
    "M 60 110 Q 100 80 140 110",
    "M 70 130 Q 100 150 130 130",
    "M 90 60 Q 110 100 90 140",
    "M 110 60 Q 90 100 110 140",
  ];

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="absolute inset-0"
        aria-hidden
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#A78BFA" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dendrites — six lines drawn from center to each petal endpoint */}
        {petals.map((p, i) => (
          <motion.line
            key={`den-${i}`}
            x1={100}
            y1={100}
            x2={p.x}
            y2={p.y}
            stroke="#A78BFA"
            strokeWidth={1.1}
            strokeLinecap="round"
            strokeOpacity={0.55}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 1.1, ease: "easeOut", delay: i * 0.1 }
            }
          />
        ))}

        {/* Petals — small node circles, staggered sine pulse */}
        {petals.map((p, i) => (
          <motion.circle
            key={`petal-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#A78BFA"
            initial={{ scale: 0, opacity: 0 }}
            animate={
              reducedMotion
                ? { scale: 1, opacity: 0.95 }
                : {
                    scale: [1, 1.6, 1],
                    opacity: [0.6, 1, 0.6],
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0, delay: i * 0.05 }
                : {
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: 0.4 + i * 0.2,
                  }
            }
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          />
        ))}

        {/* Central core — main attraction */}
        <motion.circle
          cx={100}
          cy={100}
          r={28}
          fill={`url(#${gradId})`}
          animate={
            reducedMotion
              ? undefined
              : {
                  r: [28, 30, 28],
                  opacity: [1, 0.92, 1],
                }
          }
          transition={
            reducedMotion ? undefined : { duration: 4, ease: "easeInOut", repeat: Infinity }
          }
        />

        {/* Sparks — small particles floating along arcs */}
        {!reducedMotion &&
          sparks.map((d, i) => (
            <g key={`spark-${i}`}>
              <path
                id={`spark-path-${i}`}
                d={d}
                fill="none"
                stroke="none"
                strokeWidth={1}
              />
              <circle r={1.4} fill="#F0ABFC">
                <animateMotion
                  dur={`${4 + i * 0.4}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                >
                  <mpath href={`#spark-path-${i}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur={`${2 + i * 0.3}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
      </svg>
    </div>
  );
};

export default NeuralBloom;
