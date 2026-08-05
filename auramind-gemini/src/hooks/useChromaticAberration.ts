import { useState, useCallback, useRef, useEffect } from "react";

interface ChromaticOptions {
  intensity?: number;
  decay?: number;
}

export function useChromaticAberration(options: ChromaticOptions = {}) {
  const { intensity = 4, decay = 0.92 } = options;
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const lastMouseRef = useRef({ x: 0, y: 0, time: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const now = performance.now();
      const dt = Math.max(now - lastMouseRef.current.time, 1);
      const vx = (e.clientX - lastMouseRef.current.x) / dt;
      const vy = (e.clientY - lastMouseRef.current.y) / dt;
      velocityRef.current = { x: vx * intensity, y: vy * intensity };
      lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };
    },
    [intensity]
  );

  useEffect(() => {
    const animate = () => {
      setOffset((prev) => ({
        x: prev.x * decay + velocityRef.current.x * (1 - decay),
        y: prev.y * decay + velocityRef.current.y * (1 - decay),
      }));
      velocityRef.current.x *= decay;
      velocityRef.current.y *= decay;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [decay]);

  const reset = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  const style = {
    filter: `drop-shadow(${offset.x}px 0 0 rgba(255,0,0,0.3)) drop-shadow(${-offset.x}px 0 0 rgba(0,100,255,0.3))`,
    transition: "filter 0.1s ease-out",
  };

  return { offset, style, handleMouseMove, reset };
}
