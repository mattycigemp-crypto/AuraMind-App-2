import { useMemo } from "react";

/* mulberry32 — a fast, seedable 32-bit PRNG (SSR-safe, deterministic) */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface NeuralBackgroundProps {
  opacity?: number;
  glow?: boolean;
  className?: string;
  seed?: number;
}

export function NeuralBackground({
  opacity = 0.06,
  glow = true,
  className = "",
  seed = 42,
}: NeuralBackgroundProps) {
  const rand = useMemo(() => mulberry32(seed), [seed]);

  const nodes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        x: (rand() * 100).toFixed(2),
        y: (rand() * 100).toFixed(2),
        r: (rand() * 1.6 + 0.6).toFixed(2),
        delay: (rand() * 4).toFixed(2),
        duration: (rand() * 3 + 3).toFixed(2),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );

  const edges = useMemo(() => {
    const list: { a: number; b: number }[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const ax = parseFloat(nodes[i].x);
        const ay = parseFloat(nodes[i].y);
        const bx = parseFloat(nodes[j].x);
        const by = parseFloat(nodes[j].y);
        const d = Math.hypot(ax - bx, ay - by);
        if (d < 22) list.push({ a: i, b: j });
      }
    }
    return list;
  }, [nodes]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden neural-grid-bg ${className}`}
    >
      {glow && (
        <>
          <div
            className="absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18), transparent 60%)" }}
          />
          <div
            className="absolute -bottom-32 right-1/4 h-[380px] w-[380px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.10), transparent 60%)" }}
          />
        </>
      )}

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ opacity }}
      >
        <defs>
          <linearGradient id="neuralLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="neuralNode">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {edges.map((e) => {
          const a = nodes[e.a];
          const b = nodes[e.b];
          return (
            <line
              key={`${a.id}-${b.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#neuralLine)"
              strokeWidth={0.08}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="url(#neuralNode)"
            className="neural-node-pulse"
            style={{
              "--nn-delay": `${n.delay}s`,
              "--nn-duration": `${n.duration}s`,
            } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
