import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMouseTracking } from '../../hooks/useMouseTracking';

interface Orb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

interface MouseOrbsProps {
  theme: 'light' | 'dark';
}

const MouseOrbs: React.FC<MouseOrbsProps> = ({ theme }) => {
  const { mousePosition } = useMouseTracking();
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  // Initialize orbs
  useEffect(() => {
    const initialOrbs: Orb[] = [
      { id: 1, x: window.innerWidth * 0.2, y: window.innerHeight * 0.3, vx: 0, vy: 0, size: 80, color: theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)', opacity: 0.6 },
      { id: 2, x: window.innerWidth * 0.8, y: window.innerHeight * 0.7, vx: 0, vy: 0, size: 60, color: theme === 'dark' ? 'rgba(217, 70, 239, 0.3)' : 'rgba(217, 70, 239, 0.2)', opacity: 0.5 },
      { id: 3, x: window.innerWidth * 0.6, y: window.innerHeight * 0.2, vx: 0, vy: 0, size: 100, color: theme === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)', opacity: 0.7 },
    ];
    setOrbs(initialOrbs);
  }, [theme]);

  // Physics animation
  useEffect(() => {
    const animate = () => {
      setOrbs(prevOrbs => 
        prevOrbs.map(orb => {
          let { x, y, vx, vy } = orb;
          const { size } = orb;
          
          // Spring physics towards mouse with dampening
          const dx = mousePosition.x - x;
          const dy = mousePosition.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxForce = 2;
          const force = Math.min(maxForce, distance * 0.0005);
          
          vx += (dx / distance) * force;
          vy += (dy / distance) * force;
          
          // Apply velocity with friction
          vx *= 0.85;
          vy *= 0.85;
          x += vx;
          y += vy;
          
          // Boundary collision
          if (x < size / 2) { x = size / 2; vx = Math.abs(vx) * 0.8; }
          if (x > window.innerWidth - size / 2) { x = window.innerWidth - size / 2; vx = -Math.abs(vx) * 0.8; }
          if (y < size / 2) { y = size / 2; vy = Math.abs(vy) * 0.8; }
          if (y > window.innerHeight - size / 2) { y = window.innerHeight - size / 2; vy = -Math.abs(vy) * 0.8; }
          
          return { ...orb, x, y, vx, vy };
        })
      );
      
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [mousePosition]);

  // Orb connections when close
  const connections = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; opacity: number }> = [];
    
    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        const dx = orbs[i].x - orbs[j].x;
        const dy = orbs[i].y - orbs[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 300) {
          const opacity = (1 - distance / 300) * 0.3;
          lines.push({
            x1: orbs[i].x,
            y1: orbs[i].y,
            x2: orbs[j].x,
            y2: orbs[j].y,
            opacity
          });
        }
      }
    }
    
    return lines;
  }, [orbs]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0">
      <svg className="absolute inset-0 w-full h-full">
        {/* Connections */}
        {connections.map((line, index) => (
          <line
            key={`line-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)'}
            strokeWidth="1"
            opacity={line.opacity}
          />
        ))}
        
        {/* Orbs */}
        {orbs.map(orb => (
          <g key={orb.id}>
            <defs>
              <radialGradient id={`orb-gradient-${orb.id}`}>
                <stop offset="0%" stopColor={orb.color} />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle
              cx={orb.x}
              cy={orb.y}
              r={orb.size / 2}
              fill={`url(#orb-gradient-${orb.id})`}
              opacity={orb.opacity}
              style={{
                filter: theme === 'dark' ? 'blur(40px) brightness(1.5)' : 'blur(30px)',
              }}
            />
            <circle
              cx={orb.x}
              cy={orb.y}
              r={orb.size / 4}
              fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
              style={{
                filter: 'blur(10px) brightness(1.5)',
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default MouseOrbs;


