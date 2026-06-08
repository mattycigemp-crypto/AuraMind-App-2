import React from 'react';

const JavaScriptIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#F7DF1E"/>
    <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">JS</text>
  </svg>
);

const ReactIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#61DAFB"/>
    <ellipse cx="12" cy="12" rx="6" ry="2.5" fill="none" stroke="#000" strokeWidth="0.5"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#000" strokeWidth="0.5" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#000" strokeWidth="0.5" transform="rotate(-60 12 12)"/>
  </svg>
);

const DatabaseIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" fill="#4479A1"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" fill="#4479A1"/>
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke="#FFF" strokeWidth="1"/>
    <path d="M3 5c0 1.66 4 3 9 3s9-1.34 9-3" stroke="#FFF" strokeWidth="1"/>
  </svg>
);

const MLIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#FF6F00"/>
    <circle cx="8" cy="8" r="2" fill="#FFF"/>
    <circle cx="16" cy="8" r="2" fill="#FFF"/>
    <circle cx="8" cy="16" r="2" fill="#FFF"/>
    <circle cx="16" cy="16" r="2" fill="#FFF"/>
    <line x1="8" y1="8" x2="16" y2="16" stroke="#FFF" strokeWidth="2"/>
    <line x1="16" y1="8" x2="8" y2="16" stroke="#FFF" strokeWidth="2"/>
  </svg>
);

const DataStructuresIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#00C853"/>
    <rect x="6" y="6" width="4" height="4" fill="#FFF"/>
    <rect x="14" y="6" width="4" height="4" fill="#FFF"/>
    <rect x="6" y="14" width="4" height="4" fill="#FFF"/>
    <rect x="14" y="14" width="4" height="4" fill="#FFF"/>
    <line x1="8" y1="10" x2="8" y2="14" stroke="#FFF" strokeWidth="2"/>
    <line x1="16" y1="10" x2="16" y2="14" stroke="#FFF" strokeWidth="2"/>
  </svg>
);

const TypeScriptIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#3178C6"/>
    <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#FFF">TS</text>
  </svg>
);

export const LearningPathIcons = {
  javascript: JavaScriptIcon,
  react: ReactIcon,
  database: DatabaseIcon,
  ml: MLIcon,
  datastructures: DataStructuresIcon,
  typescript: TypeScriptIcon,
};



