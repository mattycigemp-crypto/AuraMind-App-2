import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMouseTracking } from '../../hooks/useMouseTracking';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  speed: number;
}

interface ParticleSystemProps {
  theme: 'light' | 'dark';
  count?: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ theme, count = 50 }) => {
  const { mousePosition } = useMouseTracking();
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 2 + 1
      });
    }
    setParticles(newParticles);
  }, [count]);

  // Animation with mouse interaction
  useEffect(() => {
    const animate = () => {
      setParticles(prevParticles =>
        prevParticles.map(particle => {
          let { x, y, vx, vy } = particle;
const { speed } = particle;
          
          // Mouse repulsion effect
          const dx = mousePosition.x - x;
          const dy = mousePosition.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const repulsionForce = Math.max(0, (100 - distance) / 100) * 2;
          
          // Apply velocity with repulsion
          vx += (-dx / distance) * repulsionForce;
          vy += (-dy / distance) * repulsionForce;
          
          // Apply velocity with friction
          vx *= 0.99;
          vy *= 0.99;
          x += vx * speed;
          y += vy * speed;
          
          // Wrap around screen
          if (x < 0) x = window.innerWidth;
          if (x > window.innerWidth) x = 0;
          if (y < 0) y = window.innerHeight;
          if (y > window.innerHeight) y = 0;
          
          // Dynamic opacity based on distance to mouse. This fully
          // replaces the particle's stored opacity, so it is derived
          // here rather than destructured above.
          const opacity = Math.max(0.1, Math.min(0.8, distance / 200));
          
          return { ...particle, x, y, vx, vy, opacity };
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

  // Calculate connections between nearby particles
  const connections = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; opacity: number }> = [];
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.2;
          lines.push({
            x1: particles[i].x,
            y1: particles[i].y,
            x2: particles[j].x,
            y2: particles[j].y,
            opacity
          });
        }
      }
    }
    
    return lines;
  }, [particles]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0">
      <svg className="absolute inset-0 w-full h-full">
        {/* Connections */}
        {connections.map((line, index) => (
          <line
            key={`connection-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={theme === 'dark' ? 'rgba(147, 197, 253, 0.15)' : 'rgba(99, 102, 241, 0.15)'}
            strokeWidth="0.5"
            opacity={line.opacity}
          />
        ))}
        
        {/* Particles */}
        {particles.map(particle => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill={theme === 'dark' ? 
              `rgba(147, 197, 253, ${particle.opacity})` : 
              `rgba(99, 102, 241, ${particle.opacity})`
            }
            style={{
              filter: 'blur(1px)',
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default ParticleSystem;


