/**
 * ConstellationMap — hand-coded animated SVG: knowledge graph.
 *
 * Shows a personal "knowledge constellation": the user's decks as glowing
 * nodes with weighted connections between them. Edges draw themselves
 * in via stroke-dashoffset; nodes pulse on a sine rhythm staggered so
 * the whole field breathes.
 *
 * Use it as a centerpiece widget for the Dashboard "Knowledge Map" panel,
 * or anywhere we want to convey "these things are connected".
 *
 * Props:
 *  - nodes: array of { id, label, weight } where weight ∈ [0..1]
 *  - edges: array of { from, to, strength }
 *  - width / height: container size in px
 *  - ariaLabel: required
 */
import React, { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ConstellationNode {
  id: string;
  label?: string;
  weight: number; // 0..1 — drives node radius + glow
}

export interface ConstellationEdge {
  from: string;
  to: string;
  strength: number; // 0..1 — drives stroke opacity + width
}

interface ConstellationMapProps {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  width?: number;
  height?: number;
  className?: string;
  ariaLabel: string;
}

// Deterministic layout: place nodes on a circle + jitter on a stable hash
// so the constellation never reshuffles on every render.
function layoutNodes(
  nodes: ConstellationNode[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.36;
  nodes.forEach((node, i) => {
    const t = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    // gentle jitter (deterministic per id) so it's not a perfect ring
    const jitter = hash(node.id) % 1000 / 1000 - 0.5; // -0.5..0.5
    const jitterRadius = r * 0.18 * jitter;
    const jitterAngle = (hash(node.id + "a") % 1000) / 1000 - 0.5;
    out.set(node.id, {
      x: cx + (r + jitterRadius) * Math.cos(t + jitterAngle * 0.25),
      y: cy + (r + jitterRadius) * Math.sin(t + jitterAngle * 0.25),
    });
  });
  return out;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const ConstellationMap: React.FC<ConstellationMapProps> = ({
  nodes,
  edges,
  width = 320,
  height = 320,
  className,
  ariaLabel,
}) => {
  const reducedMotion = useReducedMotion();
  const gradId = useId();
  const haloId = useId();

  const positions = useMemo(
    () => layoutNodes(nodes, width, height),
    [nodes, width, height],
  );

  const fullPath = useMemo(() => {
    // One continuous string per edge so the stroke-draw animation works.
    return edges
      .map((e) => {
        const a = positions.get(e.from);
        const b = positions.get(e.to);
        if (!a || !b) return "";
        return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      })
      .filter(Boolean)
      .join(" ");
  }, [edges, positions]);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative inline-block", className)}
      style={{ width, height }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="absolute inset-0"
        aria-hidden
      >
        <defs>
          <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0B0B12" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Edges — draw themselves in via stroke-dashoffset on mount */}
        {fullPath && (
          <motion.path
            d={fullPath}
            stroke={`url(#${gradId})`}
            strokeWidth={1.1}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 1.4, ease: "easeOut" }
            }
          />
        )}

        {/* Nodes — pulsing halos */}
        {nodes.map((node, i) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const radius = 5 + node.weight * 8;
          return (
            <motion.g
              key={node.id}
              animate={
                reducedMotion
                  ? undefined
                  : {
                      opacity: [0.7, 1, 0.7],
                    }
              }
              transition={
                reducedMotion
                  ? undefined
                  : {
                      duration: 3.2 + (i % 4) * 0.4,
                      ease: "easeInOut",
                      repeat: Infinity,
                      delay: i * 0.18,
                    }
              }
            >
              {/* Halo */}
              <circle cx={pos.x} cy={pos.y} r={radius * 2.8} fill={`url(#${haloId})`} />
              {/* Inner glow */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius * 1.5}
                fill="#7C3AED"
                fillOpacity="0.35"
              />
              {/* Solid core */}
              <circle cx={pos.x} cy={pos.y} r={radius * 0.6} fill="#F5F3FF" />
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

export default ConstellationMap;
