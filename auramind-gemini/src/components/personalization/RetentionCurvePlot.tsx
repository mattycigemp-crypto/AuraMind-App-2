/**
 * RetentionCurvePlot — dual-line SVG plot showing predicted retrievability
 * over time under two different FSRS weight vectors.
 *
 * Renders purely with raw SVG so the bundle stays free of chart libraries;
 * the plot is small enough that a hand-rolled axis + line draw is clearer
 * than configuring a chart wrapper.
 */

import React, { useState } from 'react';
import type { RetentionPoint } from '../../services/study/profileSimulator';

interface RetentionCurvePlotProps {
  points: RetentionPoint[];
  /** Legend labels — usually {current, alt} profile names. */
  labels: { current: string; alt: string };
}

const WIDTH = 320;
const HEIGHT = 120;
const PAD_LEFT = 28;
const PAD_RIGHT = 8;
const PAD_TOP = 8;
const PAD_BOTTOM = 18;
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

function xForDay(day: number, days: number): number {
  return PAD_LEFT + (day / Math.max(1, days)) * PLOT_W;
}

function yForR(r: number): number {
  // Retrievability 1 → top, 0 → bottom.
  const clamped = Math.min(1, Math.max(0, r));
  return PAD_TOP + (1 - clamped) * PLOT_H;
}

function pathFor(points: RetentionPoint[], key: 'current' | 'alt', days: number): string {
  if (!points.length) return '';
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const x = xForDay(pt.day, days).toFixed(2);
    const y = yForR(pt[key]).toFixed(2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
}

export const RetentionCurvePlot: React.FC<RetentionCurvePlotProps> = ({ points, labels }) => {
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const maxDay = points.length > 0 ? points[points.length - 1].day : 30;
  const hoverPoint =
    hoverDay !== null ? points.find(p => p.day === hoverDay) ?? null : null;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-[120px]"
        role="img"
        aria-label={`Predicted retention curve comparing ${labels.current} to ${labels.alt}`}
        onMouseLeave={() => setHoverDay(null)}
        onMouseMove={e => {
          const rect = (e.target as SVGElement).getBoundingClientRect();
          const xRel = (e.clientX - rect.left) / rect.width;
          const day = Math.round(xRel * maxDay);
          setHoverDay(day);
        }}
      >
        {/* Y-axis grid (0.0, 0.5, 1.0) */}
        {[0, 0.25, 0.5, 0.75, 1].map(r => (
          <g key={r}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yForR(r)}
              y2={yForR(r)}
              stroke="#2A2A3A"
              strokeDasharray={r === 0.5 ? '0' : '2 4'}
              strokeWidth="0.5"
            />
            <text
              x={PAD_LEFT - 4}
              y={yForR(r) + 3}
              textAnchor="end"
              fontSize="8"
              fill="#3A3A4F"
              fontFamily="monospace"
            >
              {(r * 100).toFixed(0)}%
            </text>
          </g>
        ))}

        {/* X-axis labels (day 0, mid, max) */}
        {points.length > 0 && (
          <>
            <text x={xForDay(0, maxDay)} y={HEIGHT - 4} textAnchor="start" fontSize="8" fill="#3A3A4F" fontFamily="monospace">
              day 0
            </text>
            <text x={xForDay(maxDay / 2, maxDay)} y={HEIGHT - 4} textAnchor="middle" fontSize="8" fill="#3A3A4F" fontFamily="monospace">
              day {Math.round(maxDay / 2)}
            </text>
            <text x={xForDay(maxDay, maxDay)} y={HEIGHT - 4} textAnchor="end" fontSize="8" fill="#3A3A4F" fontFamily="monospace">
              day {maxDay}
            </text>
          </>
        )}

        {/* Current series */}
        <path
          d={pathFor(points, 'current', maxDay)}
          fill="none"
          stroke="#7C3AED"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        {/* Alt series */}
        <path
          d={pathFor(points, 'alt', maxDay)}
          fill="none"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover indicators */}
        {hoverPoint && (
          <>
            <line
              x1={xForDay(hoverPoint.day, maxDay)}
              x2={xForDay(hoverPoint.day, maxDay)}
              y1={PAD_TOP}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="#3A3A4F"
              strokeDasharray="2 3"
              strokeWidth="0.5"
            />
            <circle
              cx={xForDay(hoverPoint.day, maxDay)}
              cy={yForR(hoverPoint.current)}
              r="2.5"
              fill="#7C3AED"
            />
            <circle
              cx={xForDay(hoverPoint.day, maxDay)}
              cy={yForR(hoverPoint.alt)}
              r="2.5"
              fill="#10B981"
            />
          </>
        )}
      </svg>

      {/* Legend + hover readout */}
      <div className="flex items-center justify-between mt-1.5 text-[10px]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[#9090A8]">
            <span className="w-2.5 h-0.5 bg-[#7C3AED]" />
            {labels.current}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#10B981]">
            <span className="w-2.5 h-0.5 bg-[#10B981]" />
            {labels.alt}
          </span>
        </div>
        {hoverPoint && (
          <div className="font-mono text-[#7A7A96] tabular-nums">
            day {hoverPoint.day} · {labels.current} {(hoverPoint.current * 100).toFixed(0)}% ·{' '}
            {labels.alt} {(hoverPoint.alt * 100).toFixed(0)}%
          </div>
        )}
        {!hoverPoint && (
          <span className="text-[#3A3A4F]">hover for values</span>
        )}
      </div>
    </div>
  );
};

export default RetentionCurvePlot;
