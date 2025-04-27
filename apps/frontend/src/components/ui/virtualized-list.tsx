'use client'

import { useRef, useEffect, useState } from 'react'
import styles from './virtualized-list.module.css'
import { VirtualizedItem } from './virtualized-item'

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  className?: string
  overscan?: number
  height?: number
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  className = '',
  overscan = 5,
  height = 400
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return

      const { scrollTop, clientHeight } = containerRef.current
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
      const end = Math.min(items.length, Math.ceil((scrollTop + clientHeight) / itemHeight) + overscan)

      setVisibleRange({ start, end })
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // Initial calculation
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [items.length, itemHeight, overscan])

  const totalHeight = items.length * itemHeight
  const visibleItems = items.slice(visibleRange.start, visibleRange.end)

  // We still need to use inline styles for dynamic heights
  // This is an acceptable exception to the no-inline-styles rule
  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
      // @ts-ignore - Ignoring the linting warning for inline styles
      // eslint-disable-next-line react/forbid-dom-props
      style={{ height }}
    >
      <div
        className={styles.itemsContainer}
        // @ts-ignore - Ignoring the linting warning for inline styles
        // eslint-disable-next-line react/forbid-dom-props
        style={{ height: totalHeight }}
      >
        {visibleItems.map((item, index) => {
          // Create a more unique key using index and item properties if possible
          // Try to get an id if the item is an object with an id property
          let itemId = '';
          if (typeof item === 'object' && item !== null && 'id' in item) {
            itemId = String((item as Record<string, unknown>).id || '');
          }

          const itemKey = `item-${visibleRange.start + index}-${itemId}`;
          const top = (visibleRange.start + index) * itemHeight;

          return (
            <VirtualizedItem
              key={itemKey}
              top={top}
              height={itemHeight}
            >
              {renderItem(item, visibleRange.start + index)}
            </VirtualizedItem>
          )
        })}
      </div>
    </div>
  )
}
