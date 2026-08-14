import { useState, useEffect, useRef } from 'react';

interface ParallaxLayer {
  speed: number;
  direction: 'x' | 'y' | 'both';
  element: HTMLElement | null;
  initialPosition?: { x: number; y: number };
}

export const useParallax = (baseSpeed: number = 0.5) => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const layersRef = useRef<Map<string, ParallaxLayer>>(new Map());

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const addLayer = (id: string, element: HTMLElement | null, options: {
    speed?: number;
    direction?: 'x' | 'y' | 'both';
    initialPosition?: { x: number; y: number };
  } = {}) => {
    if (!element) return;

    const layer: ParallaxLayer = {
      speed: options.speed || baseSpeed,
      direction: options.direction || 'y',
      element,
      initialPosition: options.initialPosition || { x: 0, y: 0 }
    };

    layersRef.current.set(id, layer);
  };

  const removeLayer = (id: string) => {
    layersRef.current.delete(id);
  };

  const updateLayer = (id: string, updates: Partial<ParallaxLayer>) => {
    const layer = layersRef.current.get(id);
    if (layer) {
      layersRef.current.set(id, { ...layer, ...updates });
    }
  };

  // Apply parallax transformations
  useEffect(() => {
    layersRef.current.forEach((layer, _id) => {
      if (!layer.element) return;

      let transformX = 0;
      let transformY = 0;

      // Scroll-based parallax
      if (layer.direction === 'y' || layer.direction === 'both') {
        transformY = scrollY * layer.speed;
      }

      // Mouse-based parallax
      if (layer.direction === 'x' || layer.direction === 'both') {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const moveX = (mousePosition.x - centerX) / centerX;
        const moveY = (mousePosition.y - centerY) / centerY;
        
        transformX = moveX * layer.speed * 50;
        if (layer.direction === 'both') {
          transformY += moveY * layer.speed * 20;
        }
      }

      layer.element.style.transform = `translate3d(${transformX}px, ${transformY}px, 0)`;
      layer.element.style.willChange = 'transform';
    });
  }, [scrollY, mousePosition]);

  return {
    scrollY,
    mousePosition,
    addLayer,
    removeLayer,
    updateLayer
  };
};


