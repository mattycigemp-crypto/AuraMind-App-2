import React, { useEffect, createContext, useContext } from 'react'
import { ThemeContextType } from '../types'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  }, [])

  const value: ThemeContextType = {
    theme: 'dark',
    setTheme: () => {},
    resolvedTheme: 'dark',
    toggleTheme: () => {},
    cycleTheme: () => {},
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}



