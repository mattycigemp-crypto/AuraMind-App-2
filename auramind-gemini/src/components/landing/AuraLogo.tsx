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
        {/* Outer ring */}
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        
        {/* Core neuron shape */}
        <path
          d="M20 8 L20 14 M20 26 L20 32 M8 20 L14 20 M26 20 L32 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        
        {/* Diagonal synapses */}
        <path
          d="M14 14 L17 17 M23 23 L26 26 M26 14 L23 17 M17 23 L14 26"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="square"
          opacity="0.5"
        />
        
        {/* Center node */}
        <rect x="18" y="18" width="4" height="4" fill="currentColor" />
        
        {/* Satellite nodes */}
        <rect x="19.25" y="9.25" width="1.5" height="1.5" fill="currentColor" />
        <rect x="19.25" y="29.25" width="1.5" height="1.5" fill="currentColor" />
        <rect x="9.25" y="19.25" width="1.5" height="1.5" fill="currentColor" />
        <rect x="29.25" y="19.25" width="1.5" height="1.5" fill="currentColor" />
      </svg>
    </div>
  );
};

export default AuraLogo;



