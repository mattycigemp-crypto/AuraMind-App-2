import { useRef, type FC, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  id?: string;
}

const ParallaxSection: FC<ParallaxSectionProps> = ({
  children,
  className = '',
  speed = 0.15,
  id,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  return (
    <div ref={ref} id={id} className={className}>
      <motion.div style={{ y, opacity }}>
        {children}
      </motion.div>
    </div>
  );
};

export default ParallaxSection;
