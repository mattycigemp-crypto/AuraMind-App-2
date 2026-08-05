/**
 * MemoryStack — hand-coded animated SVG: a stack of drifting flashcards.
 *
 * Three cards floating above each other with subtle 3D tilt + a soft drift
 * loop. Used for "ready to study" hero states and the Empty Library card.
 *
 * Each card has:
 *   - a gradient body (path-rendered so we can corner-round freehand)
 *   - a thin top "content line" that draws itself in
 *   - a slow bob + tilt loop
 *
 * Props:
 *  - count: number of cards (1..5) — extra cards fade in with a stagger
 *  - ariaLabel: required
 *  - size: viewport size in px (default 200)
 */
import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MemoryStackProps {
  count?: number;
  ariaLabel: string;
  size?: number;
  className?: string;
}

const PALETTE = [
  { from: "#7C3AED", to: "#A78BFA", accent: "#F5F3FF" },
  { from: "#22D3EE", to: "#67E8F9", accent: "#0B0B12" },
  { from: "#EC4899", to: "#F0ABFC", accent: "#1F0A1E" },
  { from: "#F59E0B", to: "#FCD34D", accent: "#1F1300" },
  { from: "#10B981", to: "#34D399", accent: "#031C16" },
];

export const MemoryStack: React.FC<MemoryStackProps> = ({
  count = 3,
  ariaLabel,
  size = 200,
  className,
}) => {
  const ids = Array.from({ length: 5 }, useId);
  const reducedMotion = useReducedMotion();
  const visibleCount = Math.min(Math.max(1, count), 5);

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
        className="absolute inset-0 overflow-visible"
        aria-hidden
      >
        <defs>
          {PALETTE.map((p, i) => (
            <linearGradient
              key={ids[i]}
              id={ids[i]}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor={p.from} />
              <stop offset="100%" stopColor={p.to} />
            </linearGradient>
          ))}
        </defs>

        {Array.from({ length: visibleCount }).map((_, i) => {
          const palette = PALETTE[i];
          const cardIndex = visibleCount - 1 - i; // bottom up
          const cardX = 40 + i * 6;
          const cardY = 50 + i * 6;
          const rotation = cardIndex * -8 + (i === 0 ? -6 : 0);
          const strokeColor = palette.accent;
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, y: 24, rotate: rotation - 12 }}
              animate={
                reducedMotion
                  ? { opacity: 1, y: cardY - 100, rotate: rotation }
                  : {
                      opacity: 1,
                      y: [cardY - 100, cardY - 108, cardY - 100],
                      rotate: [rotation - 2, rotation + 2, rotation - 2],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0, delay: i * 0.05 }
                  : {
                      duration: 4.4 + i * 0.6,
                      ease: "easeInOut",
                      repeat: Infinity,
                      delay: i * 0.18,
                    }
              }
              style={{ transformOrigin: `${cardX + 60}px ${cardY + 40}px` }}
            >
              {/* Card body — rounded rect via path with bezier corners */}
              <rect
                x={cardX}
                y={cardY}
                width={120}
                height={70}
                rx={12}
                ry={12}
                fill={`url(#${ids[i]})`}
                fillOpacity={0.85}
              />
              {/* Card top highlight */}
              <rect
                x={cardX}
                y={cardY}
                width={120}
                height={36}
                rx={12}
                ry={12}
                fill="#FFFFFF"
                fillOpacity={0.07}
              />
              {/* Content line 1 — draws itself in */}
              <motion.line
                x1={cardX + 12}
                y1={cardY + 44}
                x2={cardX + 84}
                y2={cardY + 44}
                stroke={strokeColor}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeOpacity={0.55}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.18 }}
              />
              {/* Content line 2 — shorter, dims */}
              <motion.line
                x1={cardX + 12}
                y1={cardY + 56}
                x2={cardX + 60}
                y2={cardY + 56}
                stroke={strokeColor}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeOpacity={0.32}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay: 0.5 + i * 0.18 }}
              />
            </motion.g>
          );
        })}

        {/* Whisp-trail connector — only the most premium of touches */}
        {!reducedMotion && (
          <motion.path
            d="M 50 150 Q 100 130 150 150"
            stroke="#A78BFA"
            strokeWidth={1.1}
            strokeOpacity={0.25}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1] }}
            transition={{ duration: 2.4, ease: "easeOut" }}
          />
        )}
      </svg>
    </div>
  );
};

export default MemoryStack;
