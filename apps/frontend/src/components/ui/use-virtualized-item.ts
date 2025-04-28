'use client'

import { useRef, useEffect } from 'react'

/**
 * Custom hook to apply dynamic positioning to virtualized items
 * This avoids using inline styles directly in the JSX
 */
export function useVirtualizedItem(top: number, height: number) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (ref.current) {
      // Apply the styles using DOM API instead of inline styles
      ref.current.style.setProperty('--item-top', `${top}px`)
      ref.current.style.setProperty('--item-height', `${height}px`)
    }
  }, [top, height])
  
  return ref
}
