import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-up' | 'reveal';
  delay?: number;
  duration?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 1,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const animations: Record<string, gsap.TweenVars> = {
      'fade-up': {
        from: { opacity: 0, y: 80 },
        to: { opacity: 1, y: 0 },
      },
      'fade-left': {
        from: { opacity: 0, x: -100 },
        to: { opacity: 1, x: 0 },
      },
      'fade-right': {
        from: { opacity: 0, x: 100 },
        to: { opacity: 1, x: 0 },
      },
      'scale-up': {
        from: { opacity: 0, scale: 0.8 },
        to: { opacity: 1, scale: 1 },
      },
      'reveal': {
        from: { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
        to: { clipPath: 'inset(0 0% 0 0)', opacity: 1 },
      },
    };

    const animConfig = animations[animation];

    gsap.fromTo(
      element,
      { ...animConfig.from, willChange: 'transform, opacity' },
      {
        ...animConfig.to,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.trigger === element) {
          t.kill();
        }
      });
    };
  }, [animation, delay, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export const useTextReveal = () => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const chars = element.textContent?.split('') || [];
    element.innerHTML = chars
      .map((char) => `<span class="inline-block">${char === ' ' ? '&nbsp;' : char}</span>`)
      .join('');

    const spans = element.querySelectorAll('span');

    gsap.fromTo(
      spans,
      { opacity: 0, y: 50, rotationX: -90 },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.02,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
        },
      }
    );
  }, []);

  return ref;
};

export const useParallax = (speed: number = 1) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.to(element, {
      y: -200 * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, [speed]);

  return ref;
};

export default AnimatedSection;


