import { useState, useEffect, useCallback, useRef } from 'react';

interface MousePosition {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

interface MouseTrackingOptions {
  smoothing?: number;
  velocitySmoothing?: number;
}

export const useMouseTracking = (options: MouseTrackingOptions = {}) => {
  const { smoothing = 0.2, velocitySmoothing = 0.15 } = options;
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0, velocityX: 0, velocityY: 0 });
  const previousPosition = useRef<MousePosition>({ x: 0, y: 0, velocityX: 0, velocityY: 0 });
  const frameRef = useRef<number>();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const currentPosition = { x: e.clientX, y: e.clientY };
    
    // Calculate velocity
    const velocityX = currentPosition.x - previousPosition.current.x;
    const velocityY = currentPosition.y - previousPosition.current.y;
    
    // Smooth the position and velocity
    setMousePosition(prev => ({
      x: prev.x + (currentPosition.x - prev.x) * smoothing,
      y: prev.y + (currentPosition.y - prev.y) * smoothing,
      velocityX: prev.velocityX + (velocityX - prev.velocityX) * velocitySmoothing,
      velocityY: prev.velocityY + (velocityY - prev.velocityY) * velocitySmoothing
    }));
    
    previousPosition.current = { ...currentPosition, velocityX, velocityY };
  }, [smoothing, velocitySmoothing]);

  useEffect(() => {
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [handleMouseMove]);

  return mousePosition;
};