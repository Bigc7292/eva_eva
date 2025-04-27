'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
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
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  onLoad
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Handle image loading
  const handleLoad = () => {
    setIsLoaded(true)
    if (onLoad) onLoad()
  }

  // Handle image error
  const handleError = () => {
    setError(true)
    console.error(`Failed to load image: ${src}`)
  }

  // We need to use inline styles for dynamic dimensions
  // This is an acceptable exception to the no-inline-styles rule
  return (
    <div
      className={`${styles.container} ${className}`}
      // @ts-ignore - Ignoring the linting warning for inline styles
      // eslint-disable-next-line react/forbid-dom-props
      style={{ width, height }}
    >
      {!isLoaded && !error && (
        <div className={styles.placeholder} />
      )}

      {error ? (
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>Image not available</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          className={`${styles.image} ${isLoaded ? styles.imageVisible : styles.imageHidden}`}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  )
}
