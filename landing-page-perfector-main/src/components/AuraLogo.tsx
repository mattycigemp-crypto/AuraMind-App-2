import React from 'react';

interface AuraLogoProps {
  size?: number;
  className?: string;
}

const AuraLogo: React.FC<AuraLogoProps> = ({ size = 36, className = '' }) => {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer glow ring */}
        <circle cx="20" cy="20" r="18" stroke="url(#cosmicGrad)" strokeWidth="1.5" opacity="0.4" />
        
        {/* Inner orbital ring */}
        <ellipse cx="20" cy="20" rx="12" ry="12" stroke="url(#cosmicGrad)" strokeWidth="1" opacity="0.6" strokeDasharray="3 2" />
        
        {/* Core neuron shape */}
        <path
          d="M20 8 L20 14 M20 26 L20 32 M8 20 L14 20 M26 20 L32 20"
          stroke="url(#cosmicGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* Diagonal synapses */}
        <path
          d="M12.5 12.5 L16 16 M24 24 L27.5 27.5 M27.5 12.5 L24 16 M16 24 L12.5 27.5"
          stroke="url(#cosmicGrad)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
        
        {/* Center node */}
        <circle cx="20" cy="20" r="4" fill="url(#cosmicGrad)" />
        <circle cx="20" cy="20" r="2" fill="hsl(270, 100%, 95%)" />
        
        {/* Satellite nodes */}
        <circle cx="20" cy="10" r="1.5" fill="hsl(var(--primary))" />
        <circle cx="20" cy="30" r="1.5" fill="hsl(var(--primary))" />
        <circle cx="10" cy="20" r="1.5" fill="hsl(var(--primary))" />
        <circle cx="30" cy="20" r="1.5" fill="hsl(var(--primary))" />
        
        <defs>
          <linearGradient id="cosmicGrad" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default AuraLogo;
