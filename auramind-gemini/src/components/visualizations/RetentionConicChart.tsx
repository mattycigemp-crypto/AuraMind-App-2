import React, { useEffect, useRef, useState } from 'react';

interface RetentionConicChartProps {
  progress: number; // 0-100
  size?: number; // pixels
  label?: string;
  className?: string;
}

const RetentionConicChart: React.FC<RetentionConicChartProps> = ({
  progress,
  size = 200,
  label = 'Retention',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animatedProgress = isVisible ? progress : 0;

  return (
    <div
      ref={chartRef}
      className={`relative w-[${size}px] h-[${size}px] mx-auto ${className}`}
    >
      {/* Background circle */}
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgb(39 39 42 / 0.3)"
          strokeWidth="10"
        />
        
        {/* Progress arc */}
        <path
          d={`M 50 5 
             A 45 45 0 ${animatedProgress >= 50 ? 1 : 0} 1 
             ${50 + 45 * Math.sin((animatedProgress * Math.PI) / 50)} 
             ${50 - 45 * Math.cos((animatedProgress * Math.PI) / 50)}`}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          className="transition-all duration-1500 ease-out"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="0 50 50"
            begin="0s"
            dur="0.01s"
            fill="freeze"
          />
        </path>
        
        {/* Pulse indicator */}
        <circle
          cx="50"
          cy="5"
          r="3"
          fill="url(#gradient)"
          className="transition-opacity duration-1500 ease-out"
          opacity={isVisible ? 1 : 0}
        >
          <animate
            attributeName="opacity"
            values="1;0.4;1"
            keyTimes="0;0.5;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity={1} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={1} />
          </linearGradient>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.5" />
          </filter>
        </defs>
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">{animatedProgress}%</span>
          {label && (
            <span className="text-sm text-zinc-400 capitalize">{label}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export { RetentionConicChart };


