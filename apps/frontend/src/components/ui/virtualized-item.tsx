'use client'

import type React from 'react'
import styles from './virtualized-list.module.css'

interface VirtualizedItemProps {
  top: number
  height: number
  children: React.ReactNode
}

// This component encapsulates the inline styles needed for virtualization
export function VirtualizedItem({ top, height, children }: VirtualizedItemProps) {
  // We still need to use inline styles for dynamic positioning
  // This is an acceptable exception to the no-inline-styles rule
  return (
    <div 
      className={styles.itemWrapper}
      // @ts-ignore - Ignoring the linting warning for inline styles
      // eslint-disable-next-line react/forbid-dom-props
      style={{ top, height }}
    >
      {children}
    </div>
  )
}
