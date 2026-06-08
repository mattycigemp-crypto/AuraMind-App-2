// The Engineering of Awe: Variable Fonts & Kinetic Typography
// 2026 elite typography system with dynamic font variation and text animations

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Variable Font Configuration
export const VARIABLE_FONTS = {
  // Inter Variable - The modern workhorse
  inter: {
    family: 'Inter Variable',
    weights: {
      thin: 100,
      extraLight: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
      extraBold: 800,
      black: 900
    },
    slants: {
      upright: 0,
      italic: 10
    },
    opticalSizes: {
      caption: 12,
      body: 16,
      subheading: 24,
      heading: 32,
      display: 48,
      massive: 96
    }
  },
  
  // Source Code Variable - For code and technical content
  sourceCode: {
    family: 'Source Code Variable',
    weights: {
      extraLight: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
      black: 900
    },
    slants: {
      upright: 0,
      italic: 10
    }
  },
  
  // Space Grotesk Variable - For headings and display
  spaceGrotesk: {
    family: 'Space Grotesk Variable',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700
    }
  }
};

// Typography Scale System
export const TYPOGRAPHY_SCALE = {
  // Fluid typography using clamp()
  fluid: {
    'text-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
    'text-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
    'text-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
    'text-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
    'text-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
    'text-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
    'text-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
    'text-4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3.5rem)',
    'text-5xl': 'clamp(3rem, 2.5rem + 2.5vw, 5rem)',
    'text-6xl': 'clamp(3.75rem, 3rem + 3.75vw, 6.5rem)',
    'text-7xl': 'clamp(4.5rem, 3.5rem + 5vw, 8rem)',
    'text-8xl': 'clamp(6rem, 4.5rem + 7.5vw, 10rem)',
    'text-9xl': 'clamp(8rem, 5rem + 15vw, 12rem)'
  },
  
  // Fixed typography for specific contexts
  fixed: {
    'caption': '0.75rem',
    'body-sm': '0.875rem',
    'body': '1rem',
    'body-lg': '1.125rem',
    'h4': '1.25rem',
    'h3': '1.5rem',
    'h2': '2rem',
    'h1': '3rem',
    'hero': '4rem',
    'display': '6rem'
  },
  
  // Line heights optimized for readability
  lineHeight: {
    'tight': 1.1,
    'snug': 1.2,
    'normal': 1.4,
    'relaxed': 1.6,
    'loose': 1.8
  },
  
  // Letter spacing for optimal readability
  letterSpacing: {
    'tighter': '-0.05em',
    'tight': '-0.025em',
    'normal': '0em',
    'wide': '0.025em',
    'wider': '0.05em',
    'widest': '0.1em'
  }
};

// Kinetic Typography Animations
export class KineticTypography {
  private static instance: KineticTypography;
  private activeAnimations: Map<string, gsap.core.Tween> = new Map();
  
  static getInstance(): KineticTypography {
    if (!KineticTypography.instance) {
      KineticTypography.instance = new KineticTypography();
    }
    return KineticTypography.instance;
  }
  
  // Variable font weight animation
  animateWeight(
    element: HTMLElement,
    fromWeight: number = 400,
    toWeight: number = 700,
    duration: number = 0.6,
    options: gsap.TweenVars = {}
  ): gsap.core.Tween {
    const animation = gsap.to(element, {
      duration,
      'font-variation-settings': `"wght" ${toWeight}`,
      ease: 'power2.inOut',
      ...options
    });
    
    this.activeAnimations.set(element.id || Math.random().toString(), animation);
    return animation;
  }
  
  // Variable font slant animation
  animateSlant(
    element: HTMLElement,
    fromSlant: number = 0,
    toSlant: number = 10,
    duration: number = 0.4,
    options: gsap.TweenVars = {}
  ): gsap.core.Tween {
    const animation = gsap.to(element, {
      duration,
      'font-variation-settings': `"slnt" ${toSlant}`,
      ease: 'power2.inOut',
      ...options
    });
    
    return animation;
  }
  
  // Variable font optical size animation
  animateOpticalSize(
    element: HTMLElement,
    fromSize: number = 16,
    toSize: number = 32,
    duration: number = 0.5,
    options: gsap.TweenVars = {}
  ): gsap.core.Tween {
    const animation = gsap.to(element, {
      duration,
      'font-variation-settings': `"opsz" ${toSize}`,
      ease: 'power2.inOut',
      ...options
    });
    
    return animation;
  }
  
  // Complex multi-axis variable font animation
  animateVariableFont(
    element: HTMLElement,
    variations: {
      weight?: number;
      slant?: number;
      opticalSize?: number;
      width?: number;
    },
    duration: number = 0.8,
    options: gsap.TweenVars = {}
  ): gsap.core.Tween {
    const settings: string[] = [];
    
    if (variations.weight !== undefined) {
      settings.push(`"wght" ${variations.weight}`);
    }
    if (variations.slant !== undefined) {
      settings.push(`"slnt" ${variations.slant}`);
    }
    if (variations.opticalSize !== undefined) {
      settings.push(`"opsz" ${variations.opticalSize}`);
    }
    if (variations.width !== undefined) {
      settings.push(`"wdth" ${variations.width}`);
    }
    
    const animation = gsap.to(element, {
      duration,
      'font-variation-settings': settings.join(', '),
      ease: 'power2.inOut',
      ...options
    });
    
    return animation;
  }
  
  // Text reveal animation with variable font morphing
  revealText(
    element: HTMLElement,
    options: {
      direction?: 'up' | 'down' | 'left' | 'right';
      weightAnimation?: boolean;
      stagger?: number;
      duration?: number;
    } = {}
  ): gsap.core.Timeline {
    const {
      direction = 'up',
      weightAnimation = true,
      stagger = 0.05,
      duration = 0.8
    } = options;
    
    const tl = gsap.timeline();
    
    // Split text into words or characters
    const text = element.textContent || '';
    const words = text.split(' ');
    
    // Create spans for each word
    element.innerHTML = words.map(word => 
      `<span class="word">${word}</span>`
    ).join(' ');
    
    const wordElements = element.querySelectorAll('.word');
    
    // Set initial state
    gsap.set(wordElements, {
      opacity: 0,
      y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0,
      x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0,
      'font-variation-settings': '"wght" 100'
    });
    
    // Animate reveal
    tl.to(wordElements, {
      opacity: 1,
      y: 0,
      x: 0,
      duration: duration * 0.6,
      stagger,
      ease: 'power2.out'
    });
    
    if (weightAnimation) {
      tl.to(wordElements, {
        'font-variation-settings': '"wght" 400',
        duration: duration * 0.4,
        stagger,
        ease: 'power2.inOut'
      }, '-=0.2');
    }
    
    return tl;
  }
  
  // Glitch text effect
  glitchText(
    element: HTMLElement,
    intensity: number = 0.5,
    duration: number = 0.3
  ): gsap.core.Timeline {
    const tl = gsap.timeline({ repeat: 3 });
    
    const originalText = element.textContent || '';
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    tl.to(element, {
      duration: duration * 0.1,
      'font-variation-settings': `"wght" ${900}`,
      ease: 'steps(1)'
    })
    .to(element, {
      duration: duration * 0.1,
      'font-variation-settings': `"wght" ${100}`,
      ease: 'steps(1)'
    })
    .to(element, {
      duration: duration * 0.1,
      'font-variation-settings': `"wght" ${400}`,
      ease: 'steps(1)'
    });
    
    return tl;
  }
  
  // Typewriter effect with variable font
  typewriter(
    element: HTMLElement,
    text: string,
    options: {
      speed?: number;
      weightAnimation?: boolean;
      cursor?: boolean;
    } = {}
  ): gsap.core.Timeline {
    const {
      speed = 50,
      weightAnimation = true,
      cursor = true
    } = options;
    
    const tl = gsap.timeline();
    element.textContent = '';
    
    if (cursor) {
      element.innerHTML = '<span class="cursor">|</span>';
      const cursorElement = element.querySelector('.cursor');
      
      // Animate cursor
      gsap.to(cursorElement, {
        opacity: 0,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'steps(1)'
      });
    }
    
    // Type each character
    text.split('').forEach((char, index) => {
      tl.call(() => {
        const currentText = element.textContent!.replace('|', '');
        element.textContent = currentText + char + (cursor ? '|' : '');
        
        if (weightAnimation && char !== ' ') {
          gsap.fromTo(element, 
            { 'font-variation-settings': '"wght" 600' },
            { 
              'font-variation-settings': '"wght" 400',
              duration: 0.1,
              ease: 'power2.out'
            }
          );
        }
      }, [], index * speed / 1000);
    });
    
    return tl;
  }
  
  // Scroll-driven typography animation
  scrollTypography(
    element: HTMLElement,
    trigger: HTMLElement,
    options: {
      weightStart?: number;
      weightEnd?: number;
      slantStart?: number;
      slantEnd?: number;
      scrub?: boolean;
      pin?: boolean;
    } = {}
  ): gsap.core.Tween {
    const {
      weightStart = 400,
      weightEnd = 700,
      slantStart = 0,
      slantEnd = 0,
      scrub = true,
      pin = false
    } = options;
    
    return gsap.to(element, {
      'font-variation-settings': `"wght" ${weightEnd}, "slnt" ${slantEnd}`,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub,
        pin
      }
    });
  }
  
  // Magnetic text effect
  magneticText(
    element: HTMLElement,
    options: {
      strength?: number;
      radius?: number;
      weightEffect?: boolean;
    } = {}
  ): void {
    const {
      strength = 0.3,
      radius = 100,
      weightEffect = true
    } = options;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / radius;
      const deltaY = (e.clientY - centerY) / radius;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance < 1) {
        const force = (1 - distance) * strength;
        
        gsap.to(element, {
          x: deltaX * force * 20,
          y: deltaY * force * 20,
          duration: 0.3,
          ease: 'power2.out'
        });
        
        if (weightEffect) {
          const weight = 400 + (force * 300);
          gsap.to(element, {
            'font-variation-settings': `"wght" ${weight}`,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      }
    };
    
    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        'font-variation-settings': '"wght" 400',
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
  }
  
  // Cleanup animations
  cleanup(): void {
    this.activeAnimations.forEach(animation => {
      animation.kill();
    });
    this.activeAnimations.clear();
  }
}

// Typography utilities
export const typographyUtils = {
  // Get optimal font weight based on context
  getOptimalWeight(context: 'body' | 'heading' | 'display' | 'caption'): number {
    const weights = {
      body: 400,
      heading: 600,
      display: 800,
      caption: 300
    };
    return weights[context];
  },
  
  // Calculate line height based on font size
  getLineHeight(fontSize: number, context: 'tight' | 'normal' | 'relaxed' = 'normal'): number {
    const baseLineHeight = {
      tight: 1.1,
      normal: 1.4,
      relaxed: 1.6
    };
    
    // Smaller fonts need slightly larger line heights for readability
    const fontSizeFactor = fontSize < 16 ? 1.1 : fontSize > 24 ? 0.95 : 1;
    
    return baseLineHeight[context] * fontSizeFactor;
  },
  
  // Generate CSS custom properties for variable fonts
  generateVariableFontCSS(): string {
    return `
      :root {
        --font-weight-min: 100;
        --font-weight-max: 900;
        --font-slant-min: -10;
        --font-slant-max: 10;
        --font-width-min: 62.5;
        --font-width-max: 100;
        --font-optical-size-min: 8;
        --font-optical-size-max: 96;
      }
      
      .variable-font {
        font-variation-settings: 
          "wght" var(--font-weight, 400),
          "slnt" var(--font-slant, 0),
          "wdth" var(--font-width, 100),
          "opsz" var(--font-optical-size, 16);
        transition: font-variation-settings 0.3s ease;
      }
      
      .fluid-typo {
        font-size: var(--fluid-size, 1rem);
        line-height: var(--fluid-line-height, 1.4);
        letter-spacing: var(--fluid-letter-spacing, 0);
      }
    `;
  }
};

// Export singleton instance
export const kineticTypography = KineticTypography.getInstance();


