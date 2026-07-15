import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  glowOnHover?: boolean;
  delay?: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  className = '',
  enableTilt = true,
  glowOnHover = true,
  delay = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
      }}
      className={cn('relative', className)}
    >
      <motion.div
        style={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          transformStyle: 'preserve-3d',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative"
      >
        {glowOnHover && (
          <div
            className={cn(
              'absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none',
              'bg-gradient-to-r from-[#8B5CF6]/20 via-[#7C3AED]/20 to-[#8B5CF6]/20',
              isHovered && 'opacity-100'
            )}
            style={{ transform: 'translateZ(-1px)' }}
          />
        )}
        {children}
      </motion.div>
    </motion.div>
  );
};

export { DashboardCard };
