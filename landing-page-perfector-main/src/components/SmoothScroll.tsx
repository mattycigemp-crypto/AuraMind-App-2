import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { motion, useScroll, useSpring } from 'framer-motion';

const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  });

  return (
    <>
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary origin-left z-[200]"
      />
      {children}
    </>
  );
};

export default SmoothScroll;
