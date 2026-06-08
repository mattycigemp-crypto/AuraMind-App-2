import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StunningCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag?: string;
  delay?: number;
}

export const StunningCard: React.FC<StunningCardProps> = ({
  icon,
  title,
  description,
  tag,
  delay = 0,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{
          rotateY: mousePosition.x * 5,
          rotateX: -mousePosition.y * 5,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 glass-card-protocol p-10 rounded-sm border border-border overflow-hidden"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at ${
              (mousePosition.x + 1) * 50
            }% ${
              (mousePosition.y + 1) * 50
            }%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)`,
          }}
        />

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-20">
          <div className="flex justify-between items-start mb-10">
            <motion.div
              className="h-12 w-12 bg-primary/5 border border-primary/20 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {icon}
            </motion.div>
            {tag && (
              <motion.span
                className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[.4em]"
                animate={{ opacity: isHovered ? 0.5 : 0.3 }}
              >
                {tag}
              </motion.span>
            )}
          </div>

          <motion.h3
            className="text-2xl font-black italic text-foreground mb-5 uppercase tracking-tight"
            whileHover={{ x: 10 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {title}
          </motion.h3>

          <p className="text-muted-foreground text-sm leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 w-full h-1 bg-primary"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      <motion.div
        className="absolute -inset-2 bg-primary/20 blur-2xl rounded-lg opacity-0 group-hover:opacity-100"
        animate={{
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

interface FeatureCard3DProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

export const FeatureCard3D: React.FC<FeatureCard3DProps> = ({
  icon,
  title,
  description,
  index,
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = (e.clientX - rect.left - rect.width / 2) / -20;
    setRotation({ x, y });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100, rotateX: -45 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.2, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
      }}
      className="glass-card-protocol p-8 border border-border rounded-sm"
    >
      <motion.div
        style={{ transform: 'translateZ(50px)' }}
        className="mb-6"
      >
        <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center text-primary">
          {icon}
        </div>
      </motion.div>

      <motion.h3
        style={{ transform: 'translateZ(30px)' }}
        className="text-xl font-black text-foreground mb-3"
      >
        {title}
      </motion.h3>

      <motion.p
        style={{ transform: 'translateZ(20px)' }}
        className="text-muted-foreground text-sm"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export default StunningCard;


