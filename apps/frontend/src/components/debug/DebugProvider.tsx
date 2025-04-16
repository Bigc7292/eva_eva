'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { DebugDashboard } from './DebugDashboard'

interface DebugContextType {
  isDebugMode: boolean
  toggleDebugMode: () => void
}

const DebugContext = createContext<DebugContextType>({
  isDebugMode: false,
  toggleDebugMode: () => {}
})

export function useDebug() {
  return useContext(DebugContext)
}

interface DebugProviderProps {
  children: ReactNode
  initialDebugMode?: boolean
}

export function DebugProvider({ children, initialDebugMode = false }: DebugProviderProps) {
  const [isDebugMode, setIsDebugMode] = useState(initialDebugMode)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if debug mode was previously enabled
    const savedDebugMode = localStorage.getItem('debug_mode')
    if (savedDebugMode) {
      setIsDebugMode(savedDebugMode === 'true')
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      // Save debug mode preference
      localStorage.setItem('debug_mode', String(isDebugMode))
    }
  }, [isDebugMode, isLoaded])

  const toggleDebugMode = () => {
    setIsDebugMode(prev => !prev)
  }

  // Add keyboard shortcut to toggle debug mode (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        toggleDebugMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <DebugContext.Provider value={{ isDebugMode, toggleDebugMode }}>
      {children}
      {isDebugMode && <DebugDashboard />}
    </DebugContext.Provider>
  )
}
