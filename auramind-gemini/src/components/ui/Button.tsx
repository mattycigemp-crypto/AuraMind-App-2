import React from 'react';

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'primary' | 'secondary' | 'destructive' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'default' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
}

const variantStylesMap: Record<ButtonVariant, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
  outline: 'border border-white/20 bg-transparent hover:bg-white/10',
  ghost: 'hover:bg-white/10',
};

const sizeStylesMap: Record<string, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4',
  lg: 'h-12 px-6',
  default: 'h-10 px-4 py-2',
  icon: 'h-10 w-10',
};

export function buttonVariants({ variant = 'default', size = 'md', className = '' }: Partial<ButtonProps> = {}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  return `${baseStyles} ${variantStylesMap[variant]} ${sizeStylesMap[size] || ''} ${className}`;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStylesMap[variant]} ${sizeStylesMap[size] || ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';



