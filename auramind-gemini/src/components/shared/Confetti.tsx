import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  shape: 'circle' | 'square' | 'star' | 'confetti';
}

const COLORS = [
  '#7C3AED', '#8B5CF6', '#6366F1', '#3B82F6',
  '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#14B8A6', '#F97316', '#A855F7', '#06B6D4',
];

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  spread?: number;
  originY?: number;
}

const Confetti: React.FC<ConfettiProps> = ({
  isActive,
  duration = 3000,
  particleCount = 60,
  spread = 360,
  originY = 0.3,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
      const velocity = 400 + Math.random() * 600;
      newParticles.push({
        id: i,
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity - 200 - Math.random() * 400,
        rotation: Math.random() * 720 - 360,
        scale: 0.5 + Math.random() * 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.3,
        shape: (['circle', 'square', 'confetti', 'confetti', 'confetti', 'star'] as const)[
          Math.floor(Math.random() * 6)
        ],
      });
    }
    return newParticles;
  }, [particleCount, spread]);

  useEffect(() => {
    if (isActive) {
      setParticles(generateParticles());
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration + 500);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isActive, duration, generateParticles]);

  return (
    <AnimatePresence>
      {show && (
        <div
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          style={{ perspective: '800px' }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: 0,
                y: `${originY * 100}vh`,
                rotate: 0,
                scale: 0,
                opacity: 0,
              }}
              animate={{
                x: p.x,
                y: `calc(${originY * 100}vh + ${p.y}px)`,
                rotate: p.rotation,
                scale: p.scale,
                opacity: [0, 1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: duration / 1000,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: {
                  times: [0, 0.1, 0.8, 1],
                  duration: duration / 1000,
                  delay: p.delay,
                },
              }}
              className="absolute left-1/2"
              style={{
                width: p.shape === 'confetti' ? `${6 + Math.random() * 8}px` : `${4 + Math.random() * 6}px`,
                height: p.shape === 'confetti' ? `${10 + Math.random() * 14}px` : `${4 + Math.random() * 6}px`,
                background: p.color,
                borderRadius:
                  p.shape === 'circle' ? '50%' :
                  p.shape === 'star' ? '1px' :
                  p.shape === 'confetti' ? '1px' :
                  '2px',
                transform: p.shape === 'star' ? 'rotate(45deg)' : undefined,
                boxShadow: `0 0 6px ${p.color}60`,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export default Confetti;

// ─── Hook for easy confetti triggering ───
export function useConfetti() {
  const [celebrate, setCelebrate] = useState(false);
  const [key, setKey] = useState(0);

  const fire = useCallback(() => {
    setKey(k => k + 1);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 100);
  }, []);

  const ConfettiElement = useCallback(
    () => <Confetti key={key} isActive={celebrate} />,
    [key, celebrate]
  );

  return { fire, ConfettiElement };
}
