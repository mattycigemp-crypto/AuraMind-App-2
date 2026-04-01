// Premium Design Tokens for Billion-Dollar Dashboard
// Following Fortune 500 design standards

export const tokens = {
  // Colors - Premium palette with semantic naming
  colors: {
    // Primary brand colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    
    // Secondary accent colors
    secondary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e',
    },
    
    // Neutral grays with premium warmth
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    
    // Success colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    
    // Warning colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    
    // Error colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    
    // Glassmorphism colors
    glass: {
      light: 'rgba(255, 255, 255, 0.8)',
      medium: 'rgba(255, 255, 255, 0.6)',
      dark: 'rgba(255, 255, 255, 0.4)',
      border: 'rgba(255, 255, 255, 0.2)',
    },
    
    // Gradient definitions
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      dark: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    },
  },
  
  // Typography - Premium font system
  typography: {
    // Font families
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      display: ['Cal Sans', 'Inter', 'sans-serif'],
    },
    
    // Font sizes with modular scale
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    
    // Font weights
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    
    // Letter spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    
    // Line heights
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },
  
  // Spacing - Premium spacing system
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  
  // Border radius - Premium radius system
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    '4xl': '2rem',
    full: '9999px',
  },
  
  // Shadows - Premium shadow system
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    
    // Premium shadows
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    glowLg: '0 0 40px rgba(99, 102, 241, 0.4)',
    glowXl: '0 0 60px rgba(99, 102, 241, 0.5)',
    
    // Glassmorphism shadows
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    glassSm: '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
    glassLg: '0 16px 64px 0 rgba(31, 38, 135, 0.5)',
    
    // Colored shadows
    primary: '0 10px 25px -5px rgba(14, 165, 233, 0.25)',
    secondary: '0 10px 25px -5px rgba(217, 70, 239, 0.25)',
    success: '0 10px 25px -5px rgba(34, 197, 94, 0.25)',
    warning: '0 10px 25px -5px rgba(245, 158, 11, 0.25)',
    error: '0 10px 25px -5px rgba(239, 68, 68, 0.25)',
  },
  
  // Animation - Premium animation system
  animation: {
    // Durations
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    
    // Timing functions
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      
      // Premium easing
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
    },
    
    // Keyframes
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideDown: {
        '0%': { transform: 'translateY(-20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideLeft: {
        '0%': { transform: 'translateX(20px)', opacity: '0' },
        '100%': { transform: 'translateX(0)', opacity: '1' },
      },
      slideRight: {
        '0%': { transform: 'translateX(-20px)', opacity: '0' },
        '100%': { transform: 'translateX(0)', opacity: '1' },
      },
      scale: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      rotate: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
      bounce: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
      },
      glow: {
        '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
        '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)' },
      },
    },
  },
  
  // Z-index - Premium layer system
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200',
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    skipLink: '1600',
    toast: '1700',
    tooltip: '1800',
    menu: '1900',
    focus: '2000',
    max: '2147483647',
  },
  
  // Breakpoints - Premium responsive system
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
    '4xl': '2560px',
  },
  
  // Container - Premium container system
  container: {
    center: true,
    padding: '2rem',
    horizontal: 'center',
  },
};

// CSS custom properties for runtime usage
const cssVars = {
  // Colors
  '--color-primary-50': tokens.colors.primary[50],
  '--color-primary-500': tokens.colors.primary[500],
  '--color-primary-900': tokens.colors.primary[900],
  
  '--color-secondary-50': tokens.colors.secondary[50],
  '--color-secondary-500': tokens.colors.secondary[500],
  '--color-secondary-900': tokens.colors.secondary[900],
  
  '--color-neutral-50': tokens.colors.neutral[50],
  '--color-neutral-500': tokens.colors.neutral[500],
  '--color-neutral-900': tokens.colors.neutral[900],
  
  '--color-success-500': tokens.colors.success[500],
  '--color-warning-500': tokens.colors.warning[500],
  '--color-error-500': tokens.colors.error[500],
  
  // Typography
  '--font-sans': tokens.typography.fontFamily.sans.join(', '),
  '--font-serif': tokens.typography.fontFamily.serif.join(', '),
  '--font-mono': tokens.typography.fontFamily.mono.join(', '),
  
  // Spacing
  '--spacing-1': tokens.spacing[1],
  '--spacing-4': tokens.spacing[4],
  '--spacing-8': tokens.spacing[8],
  '--spacing-16': tokens.spacing[16],
  
  // Border radius
  '--radius-sm': tokens.borderRadius.sm,
  '--radius-md': tokens.borderRadius.md,
  '--radius-lg': tokens.borderRadius.lg,
  '--radius-xl': tokens.borderRadius.xl,
  '--radius-2xl': tokens.borderRadius['2xl'],
  
  // Shadows
  '--shadow-sm': tokens.shadows.sm,
  '--shadow-md': tokens.shadows.md,
  '--shadow-lg': tokens.shadows.lg,
  '--shadow-xl': tokens.shadows.xl,
  '--shadow-2xl': tokens.shadows['2xl'],
  '--shadow-glow': tokens.shadows.glow,
  
  // Animation
  '--duration-150': tokens.animation.duration[150],
  '--duration-300': tokens.animation.duration[300],
  '--duration-500': tokens.animation.duration[500],
  
  '--ease-smooth': tokens.animation.easing.smooth,
  '--ease-bounce': tokens.animation.easing.bounce,
};

export { cssVars };
export default tokens;
