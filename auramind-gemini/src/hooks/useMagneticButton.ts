// Magnetic Buttons: The Engineering of Awe Micro-Interactions
// Hardware-accelerated, physics-based tactile interactions

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionValue, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MAGNETIC_BUTTON, checkReducedMotion } from '../styles/animations/awe';

interface MagneticButtonConfig {
  pullRadius?: number;
  pullStrength?: number;
  damping?: number;
  maxDistance?: number;
  enabled?: boolean;
}

interface MagneticButtonReturn {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotation: MotionValue<number>;
  elementRef: React.RefObject<HTMLElement>;
}

export const useMagneticButton = (config: MagneticButtonConfig = {}): MagneticButtonReturn => {
  const elementRef = useRef<HTMLElement>(null);
  const {
    pullRadius = MAGNETIC_BUTTON.pullRadius,
    pullStrength = MAGNETIC_BUTTON.pullStrength,
    damping = MAGNETIC_BUTTON.damping,
    maxDistance = MAGNETIC_BUTTON.maxDistance,
    enabled = true
  } = config;

  // Motion values for Framer Motion
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Physics-based spring for smooth movement
  const springX = useSpring(mouseX, { 
    stiffness: 400, 
    damping: 25,
    mass: 1
  });
  
  const springY = useSpring(mouseY, { 
    stiffness: 400, 
    damping: 25,
    mass: 1
  });

  // Transform values for the element
  const x = useTransform(springX, (value) => value);
  const y = useTransform(springY, (value) => value);
  const rotation = useTransform(springX, (value) => value * 0.1);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled || checkReducedMotion()) return;

    let rect = element.getBoundingClientRect();
    let isHovering = false;

    const updateRect = () => {
      rect = element.getBoundingClientRect();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) return;

      const { clientX, clientY } = e;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from center
      const deltaX = (clientX - centerX) / pullRadius;
      const deltaY = (clientY - centerY) / pullRadius;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Calculate magnetic pull
      let pullX = 0;
      let pullY = 0;

      if (distance < 1) {
        // Inside magnetic field
        pullX = deltaX * pullStrength * maxDistance;
        pullY = deltaY * pullStrength * maxDistance;
      } else {
        // Outside magnetic field - subtle return
        pullX = deltaX * 0.95;
        pullY = deltaY * 0.95;
      }

      // Update motion values
      mouseX.set(pullX);
      mouseY.set(pullY);
    };

    const handleMouseEnter = () => {
      isHovering = true;
      updateRect();
      
      // Add hover class for CSS transitions
      element.classList.add('magnetic-active');
    };

    const handleMouseLeave = () => {
      isHovering = false;
      
      // Animate back to center with spring physics
      mouseX.set(0);
      mouseY.set(0);
      
      // Remove hover class
      element.classList.remove('magnetic-active');
    };

    const handleResize = () => {
      updateRect();
    };

    // Event listeners
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [pullRadius, pullStrength, maxDistance, enabled]);

  return { x, y, rotation, elementRef };
};

// GSAP-based magnetic button for complex animations
export const useGSAPMagneticButton = (elementRef: React.RefObject<HTMLElement>, config: MagneticButtonConfig = {}) => {
  const {
    pullRadius = MAGNETIC_BUTTON.pullRadius,
    pullStrength = MAGNETIC_BUTTON.pullStrength,
    damping = MAGNETIC_BUTTON.damping,
    maxDistance = MAGNETIC_BUTTON.maxDistance,
    enabled = true
  } = config;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled || checkReducedMotion()) return;

    let rect = element.getBoundingClientRect();
    let isHovering = false;

    const updateRect = () => {
      rect = element.getBoundingClientRect();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) return;

      const { clientX, clientY } = e;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (clientX - centerX) / pullRadius;
      const deltaY = (clientY - centerY) / pullRadius;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let x = 0;
      let y = 0;
      let rotation = 0;

      if (distance < 1) {
        x = deltaX * pullStrength * maxDistance;
        y = deltaY * pullStrength * maxDistance;
        rotation = x * 0.1;
      } else {
        x *= 0.95;
        y *= 0.95;
        rotation *= 0.95;
      }

      gsap.to(element, {
        x,
        y,
        rotation,
        duration: 0.3,
        ease: 'power2.out',
        force3D: true
      });
    };

    const handleMouseEnter = () => {
      isHovering = true;
      updateRect();
      element.classList.add('magnetic-active');
    };

    const handleMouseLeave = () => {
      isHovering = false;
      
      gsap.to(element, {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
        force3D: true
      });
      
      element.classList.remove('magnetic-active');
    };

    const handleResize = () => {
      updateRect();
    };

    // Event listeners
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [pullRadius, pullStrength, maxDistance, enabled]);

  return elementRef;
};

// Touch-optimized magnetic button for mobile devices
export const useTouchMagneticButton = (elementRef: React.RefObject<HTMLElement>, config: MagneticButtonConfig = {}) => {
  const {
    pullRadius = MAGNETIC_BUTTON.pullRadius * 1.5, // Larger radius for touch
    pullStrength = MAGNETIC_BUTTON.pullStrength * 0.8, // Reduced strength for touch
    maxDistance = MAGNETIC_BUTTON.maxDistance * 1.2,
    enabled = true
  } = config;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled || checkReducedMotion()) return;

    let rect = element.getBoundingClientRect();
    let isTouching = false;

    const updateRect = () => {
      rect = element.getBoundingClientRect();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;

      const touch = e.touches[0];
      const { clientX, clientY } = touch;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (clientX - centerX) / pullRadius;
      const deltaY = (clientY - centerY) / pullRadius;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let x = 0;
      let y = 0;
      let scale = 1;

      if (distance < 1) {
        x = deltaX * pullStrength * maxDistance;
        y = deltaY * pullStrength * maxDistance;
        scale = 1.05; // Subtle scale for touch feedback
      } else {
        x *= 0.9;
        y *= 0.9;
        scale = 1;
      }

      gsap.to(element, {
        x,
        y,
        scale,
        duration: 0.2,
        ease: 'power2.out',
        force3D: true
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      isTouching = true;
      updateRect();
      element.classList.add('magnetic-active');
    };

    const handleTouchEnd = () => {
      isTouching = false;
      
      gsap.to(element, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.7)',
        force3D: true
      });
      
      element.classList.remove('magnetic-active');
    };

    const handleResize = () => {
      updateRect();
    };

    // Touch event listeners
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, [pullRadius, pullStrength, maxDistance, enabled]);

  return elementRef;
};

// Multi-magnetic system for button groups
export const useMagneticButtonGroup = (buttonRefs: React.RefObject<HTMLElement>[]) => {
  useEffect(() => {
    if (checkReducedMotion()) return;

    const buttons = buttonRefs.map(ref => ref.current).filter(Boolean);
    
    const handlers = buttons.map((element, index) => {
      let rect = element.getBoundingClientRect();
      let isHovering = false;

      const updateRect = () => {
        rect = element.getBoundingClientRect();
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isHovering) return;

        const { clientX, clientY } = e;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate influence from other buttons
        let totalInfluenceX = 0;
        let totalInfluenceY = 0;

        buttons.forEach((otherButton, otherIndex) => {
          if (otherIndex === index) return;

          const otherRect = otherButton.getBoundingClientRect();
          const otherCenterX = otherRect.left + otherRect.width / 2;
          const otherCenterY = otherRect.top + otherRect.height / 2;

          const distance = Math.sqrt(
            Math.pow(clientX - otherCenterX, 2) + 
            Math.pow(clientY - otherCenterY, 2)
          );

          if (distance < 200) {
            const influence = (200 - distance) / 200;
            const angle = Math.atan2(
              otherCenterY - centerY,
              otherCenterX - centerX
            );
            
            totalInfluenceX += Math.cos(angle) * influence * 20;
            totalInfluenceY += Math.sin(angle) * influence * 20;
          }
        });

        const deltaX = (clientX - centerX) / MAGNETIC_BUTTON.pullRadius;
        const deltaY = (clientY - centerY) / MAGNETIC_BUTTON.pullRadius;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        let x = 0;
        let y = 0;
        let rotation = 0;

        if (distance < 1) {
          x = deltaX * MAGNETIC_BUTTON.pullStrength * MAGNETIC_BUTTON.maxDistance + totalInfluenceX;
          y = deltaY * MAGNETIC_BUTTON.pullStrength * MAGNETIC_BUTTON.maxDistance + totalInfluenceY;
          rotation = x * 0.1;
        } else {
          x *= 0.95;
          y *= 0.95;
          rotation *= 0.95;
        }

        gsap.to(element, {
          x,
          y,
          rotation,
          duration: 0.3,
          ease: 'power2.out',
          force3D: true
        });
      };

      const handleMouseEnter = () => {
        isHovering = true;
        updateRect();
        element.classList.add('magnetic-active');
      };

      const handleMouseLeave = () => {
        isHovering = false;
        
        gsap.to(element, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.3,
          ease: 'elastic.out(1, 0.5)',
          force3D: true
        });
        
        element.classList.remove('magnetic-active');
      };

      const handleResize = () => {
        updateRect();
      };

      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('resize', handleResize);

      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
      };
    });

    return () => {
      handlers.forEach(cleanup => cleanup());
    };
  }, [buttonRefs]);
};

export default {
  useMagneticButton,
  useGSAPMagneticButton,
  useTouchMagneticButton,
  useMagneticButtonGroup
};


