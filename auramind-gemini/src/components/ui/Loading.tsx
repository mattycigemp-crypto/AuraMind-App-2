import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  variant = 'spinner',
  text,
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  if (variant === 'skeleton') {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className="flex gap-1">
          <div 
            className={cn(
              'bg-indigo-600 rounded-full animate-bounce',
              size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : size === 'lg' ? 'h-3 w-3' : 'h-4 w-4'
            )}
            style={{ animationDelay: '0ms' }}
          />
          <div 
            className={cn(
              'bg-indigo-600 rounded-full animate-bounce',
              size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : size === 'lg' ? 'h-3 w-3' : 'h-4 w-4'
            )}
            style={{ animationDelay: '150ms' }}
          />
          <div 
            className={cn(
              'bg-indigo-600 rounded-full animate-bounce',
              size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : size === 'lg' ? 'h-3 w-3' : 'h-4 w-4'
            )}
            style={{ animationDelay: '300ms' }}
          />
        </div>
        {text && (
          <span className={cn('ml-2 text-gray-600 dark:text-gray-400', textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse',
          sizeClasses[size]
        )} />
        {text && (
          <span className={cn('text-gray-600 dark:text-gray-400', textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-indigo-600', sizeClasses[size])} />
      {text && (
        <span className={cn('text-gray-600 dark:text-gray-400', textSizes[size])}>
          {text}
        </span>
      )}
    </div>
  );
};

export default Loading;
