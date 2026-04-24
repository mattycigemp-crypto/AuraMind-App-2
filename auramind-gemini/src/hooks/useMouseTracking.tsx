import { useState, useEffect, useRef, useCallback } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface MouseVelocity extends MousePosition {
  velocityX: number;
  velocityY: number;
}

export const useMouseTracking = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [mouseVelocity, setMouseVelocity] = useState<MouseVelocity>({ 
    x: 0, y: 0, velocityX: 0, velocityY: 0 
  });
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newPosition = { x: e.clientX, y: e.clientY };
    
    setMousePosition(prev => {
      const velocityX = newPosition.x - prev.x;
      const velocityY = newPosition.y - prev.y;
      
      setMouseVelocity({
        x: newPosition.x,
        y: newPosition.y,
        velocityX,
        velocityY
      });
      
      return newPosition;
    });
    
    setIsMouseMoving(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout to detect when mouse stops
    timeoutRef.current = setTimeout(() => {
      setIsMouseMoving(false);
      setMouseVelocity(prev => ({ ...prev, velocityX: 0, velocityY: 0 }));
    }, 100);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleMouseMove]);

  return {
    mousePosition,
    mouseVelocity,
    isMouseMoving
  };
};