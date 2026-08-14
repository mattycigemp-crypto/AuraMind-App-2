import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: ScrollAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin: _rootMargin = '0px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const handleScroll = useCallback(() => {
    if (!elementRef.current || (triggerOnce && hasAnimated)) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    const visible = (
      rect.top <= windowHeight * (1 - threshold) &&
      rect.bottom >= threshold * windowHeight
    );

    if (visible && !isVisible) {
      setIsVisible(true);
      if (triggerOnce) {
        setHasAnimated(true);
      }
    } else if (!visible && !triggerOnce) {
      setIsVisible(false);
    }
  }, [threshold, triggerOnce, hasAnimated, isVisible]);

  useEffect(() => {
    const throttledHandleScroll = throttle(handleScroll, 16);
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('resize', throttledHandleScroll);
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('resize', throttledHandleScroll);
    };
  }, [handleScroll]);

  return {
    ref: elementRef,
    isVisible,
    hasAnimated
  };
};

// Simple throttle function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  };
}


