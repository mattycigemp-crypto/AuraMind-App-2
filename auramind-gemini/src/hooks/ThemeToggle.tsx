import React from 'react'
import { SunIcon as Sun, MoonIcon as Moon } from '../components/icons/CustomIcons'
import { useTheme } from './useTheme'

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const { theme, toggleTheme, resolvedTheme } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative rounded-full flex items-center justify-center 
        transition-all duration-300 group shadow-sm hover:shadow-md
        border bg-slate-100 dark:bg-slate-800
        border-slate-200 dark:border-slate-700
        hover:bg-slate-200 dark:hover:bg-slate-700
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label="Toggle theme"
    >
      <div className="relative overflow-hidden" style={{ width: iconSizes[size], height: iconSizes[size] }}>
        {/* Sun icon for light mode */}
        <Sun 
          className={`absolute inset-0 text-amber-500 transition-all duration-300 ${
            resolvedTheme === 'light' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-90'
          }`}
          size={iconSizes[size]}
        />
        {/* Moon icon for dark mode */}
        <Moon 
          className={`absolute inset-0 text-indigo-400 transition-all duration-300 ${
            resolvedTheme === 'dark' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 rotate-90'
          }`}
          size={iconSizes[size]}
        />
      </div>
      
      {/* Animated glow effect */}
      <div 
        className={`
          absolute inset-0 rounded-full bg-gradient-to-r 
          transition-all duration-300 pointer-events-none
          ${theme === 'system' ? 'opacity-30' : 'opacity-0'}
          ${resolvedTheme === 'dark' 
            ? 'from-indigo-500/20 to-purple-500/20' 
            : 'from-amber-400/20 to-orange-400/20'
          }
        `}
      />
      
      {/* Hover ring effect */}
      <div 
        className={`
          absolute inset-0 rounded-full border-2 
          transition-all duration-300
          opacity-0 group-hover:opacity-100
          ${resolvedTheme === 'dark' 
            ? 'border-indigo-400/50' 
            : 'border-amber-400/50'
          }
        `}
        style={{ transform: 'scale(1.1)' }}
      />
    </button>
  )
}


