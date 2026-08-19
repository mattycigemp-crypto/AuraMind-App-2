import React from "react";

/**
 * AndroidAura — the installed app's "living" hero mark.
 *
 * Built entirely in code (inline SVG) rather than an image asset so it stays
 * razor-sharp at every density. Motion is driven by CSS keyframes (see
 * `platform-styles.css`) instead of SMIL so it honours `prefers-reduced-motion`
 * and Playwright's `animations: disabled` for deterministic visual tests.
 * It reads as a single focus point — a Prism core with orbit paths and
 * particles — rather than a generic equalizer or loader.
 */
export default function AndroidAura({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <defs>
        <radialGradient id="aura-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.95" />
          <stop offset="38%" stopColor="#c4b5fd" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="aura-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f0abfc" stopOpacity="0.85" />
        </linearGradient>
        <filter id="aura-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Breathing halo behind the core */}
      <circle
        className="aura-breathe"
        cx="120"
        cy="120"
        r="86"
        fill="none"
        stroke="url(#aura-ring)"
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Counter-rotating dashed orbits */}
      <g className="aura-orbit aura-orbit-a">
        <circle
          cx="120"
          cy="44"
          r="66"
          fill="none"
          stroke="#c4b5fd"
          strokeWidth="1.25"
          strokeDasharray="3 10"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
      <g className="aura-orbit aura-orbit-b">
        <circle
          cx="120"
          cy="60"
          r="50"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="1.25"
          strokeDasharray="1 8"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>

      {/* Orbiting particles */}
      {[0, 1, 2].map((index) => (
        <g key={index} className={`aura-orbit aura-particle aura-particle-${index}`}>
          <circle
            cx="120"
            cy={index % 2 === 0 ? "34" : "206"}
            r={index === 1 ? "3.5" : "2.4"}
            fill={index === 1 ? "#f0abfc" : "#67e8f9"}
            filter="url(#aura-glow)"
            opacity="0.9"
          />
        </g>
      ))}

      {/* Prism core */}
      <circle
        className="aura-core-breathe"
        cx="120"
        cy="120"
        r="30"
        fill="url(#aura-core)"
        filter="url(#aura-glow)"
      />
      <path
        className="aura-prism"
        d="M120 96 L136 120 L120 144 L104 120 Z"
        fill="#0d1528"
        opacity="0.85"
        stroke="#ede9fe"
        strokeWidth="1"
      />
    </svg>
  );
}
