import { useEffect, useRef, useState, type FC, type ReactNode } from "react";
import Lenis from "lenis";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isMobileWeb } from "../../lib/motion";

// Register GSAP plugins
try {
  gsap.registerPlugin(ScrollTrigger);
} catch {}

const SmoothScroll: FC<{ children: ReactNode }> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const skipSmooth = prefersReducedMotion() || isMobileWeb();

  useEffect(() => {
    if (skipSmooth) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: true,
    } as any);
    lenisRef.current = lenis;

    // Integrate Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Magnetic button effect
    const initMagneticButtons = () => {
      document.querySelectorAll(".magnetic-button").forEach((button) => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = button.getBoundingClientRect();
          const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
          const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
          gsap.to(button, { x, y, duration: 0.3, ease: "power2.out" });
        };
        const handleMouseLeave = () => {
          gsap.to(button, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        };
        button.addEventListener("mousemove", handleMouseMove);
        button.addEventListener("mouseleave", handleMouseLeave);
      });
    };

    initMagneticButtons();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [skipSmooth]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.001,
  });

  if (skipSmooth) {
    return <>{children}</>;
  }

  return (
    <>
      <motion.div
        style={{ scaleX, top: 'var(--safe-top, 0px)' }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary origin-left z-[200]"
      />
      {children}
    </>
  );
};

export default SmoothScroll;
