import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedChartWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animationType?: 'fade-up' | 'fade-in' | 'scale' | 'slide-in';
}

const AnimatedChartWrapper: React.FC<AnimatedChartWrapperProps> = ({
  children,
  className = '',
  delay = 0,
  animationType = 'fade-up',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const variants = {
    'fade-up': {
      hidden: { opacity: 0, y: 40 },
      visible: { opacity: 1, y: 0 },
    },
    'fade-in': {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    'scale': {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 },
    },
    'slide-in': {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants[animationType]}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

export { AnimatedChartWrapper };


