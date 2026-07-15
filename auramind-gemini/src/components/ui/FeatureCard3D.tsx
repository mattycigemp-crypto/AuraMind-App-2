import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FeatureCard3DProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

export const FeatureCard3D: React.FC<FeatureCard3DProps> = ({
  icon,
  title,
  description,
  delay = 0,
  className,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative p-8 rounded-3xl border bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group",
        "hover:border-indigo-500/40 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20",
        "transform-gpu will-change-transform",
        className
      )}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseLeave();
      }}
      style={{
        transform: `perspective(1000px) rotateY(${mousePosition.x * 10}deg) rotateX(${-mousePosition.y * 10}deg) scale(${isHovered ? 1.05 : 1})`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Gradient glow effect */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
          filter: 'blur(20px)',
          transform: 'translateZ(-50px)',
        }}
      />
      
      {/* Floating orb effect */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent)',
          filter: 'blur(15px)',
          transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
        }}
      />

      {/* Card content */}
      <div className="relative z-10">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
          "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300",
          "group-hover:scale-110 group-hover:rotate-3"
        )}>
          {icon}
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>
        
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
        
        {children && (
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {children}
          </div>
        )}
      </div>

      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
          transform: 'translateX(-100%)',
        }}
      >
        <div 
          className="h-full w-full"
          style={{
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>
    </motion.div>
  );
};

// Add shimmer keyframe
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;
if (!document.head.querySelector('style[data-shimmer]')) {
  style.setAttribute('data-shimmer', 'true');
  document.head.appendChild(style);
}


