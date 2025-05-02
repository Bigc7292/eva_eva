'use client'

import { useState, useEffect, useRef, memo } from 'react'
import Image from 'next/image'
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer'
import styles from './optimized-image.module.css'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  quality?: number
  onLoad?: () => void
  lazyLoadingOffset?: number // Pixels offset for lazy loading
  fallbackSrc?: string // Fallback image source
  blurhash?: string // Blurhash placeholder
  sizes?: string // Responsive sizes
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

/**
 * Enhanced optimized image component with:
 * - Improved lazy loading with IntersectionObserver
 * - Blurhash placeholder support
 * - Fallback image support
 * - Better error handling
 * - Responsive sizing
 * - Object fit control
 */
function OptimizedImageComponent({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  onLoad,
  lazyLoadingOffset = 200,
  fallbackSrc,
  blurhash,
  sizes,
  objectFit = 'cover'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const ref = useRef<HTMLDivElement>(null)

  // Use intersection observer for better lazy loading
  const isInView = useIntersectionObserver(ref, {
    rootMargin: `${lazyLoadingOffset}px`,
    once: true
  })

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src)
    setIsLoaded(false)
    setError(false)
  }, [src])

  // Handle image loading
  const handleLoad = () => {
    setIsLoaded(true)
    if (onLoad) onLoad()

    // Log successful image load for performance tracking
    if (process.env.NODE_ENV === 'development') {
      console.log(`Image loaded: ${currentSrc} (${width}x${height})`)
    }
  }

  // Handle image error
  const handleError = () => {
    // Try fallback image if available
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      console.warn(`Failed to load image: ${currentSrc}, trying fallback`)
      setCurrentSrc(fallbackSrc)
      return
    }

    setError(true)
    console.error(`Failed to load image: ${currentSrc}`)
  }

  // Generate object-fit style
  const objectFitStyle = objectFit ? { objectFit } : undefined

  // We need to use inline styles for dynamic dimensions
  // This is an acceptable exception to the no-inline-styles rule
  return (
    <div
      ref={ref}
      className={`${styles.container} ${className}`}
      // @ts-ignore - Ignoring the linting warning for inline styles
      // eslint-disable-next-line react/forbid-dom-props
      style={{ width, height }}
      data-testid="optimized-image-container"
    >
      {!isLoaded && !error && (
        <div
          className={styles.placeholder}
          style={blurhash ? { backgroundImage: `url(data:image/svg+xml;base64,${blurhash})` } : undefined}
        />
      )}

      {error ? (
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>Image not available</span>
        </div>
      ) : (
        (priority || isInView) && (
          <Image
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            quality={quality}
            className={`${styles.image} ${isLoaded ? styles.imageVisible : styles.imageHidden}`}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            sizes={sizes}
            style={objectFitStyle}
            data-testid="optimized-image"
          />
        )
      )}
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const OptimizedImage = memo(OptimizedImageComponent)
