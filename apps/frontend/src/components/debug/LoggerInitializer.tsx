'use client'

import { useEffect } from 'react'
import { simpleLogger } from './SimpleLogger'

export function LoggerInitializer() {
  useEffect(() => {
    // Add initial log
    simpleLogger.info('Application initialized', {
      timestamp: new Date().toISOString(),
      nextVersion: process.env.NEXT_PUBLIC_VERSION || 'unknown',
      environment: process.env.NODE_ENV
    })

    // Log React version
    try {
      const React = require('react')
      simpleLogger.info(`React version: ${React.version}`)
    } catch (error) {
      simpleLogger.error('Failed to get React version', { error: String(error) })
    }

    // Log performance metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigationTiming) {
          simpleLogger.info('Page load performance', {
            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime,
            loadEvent: navigationTiming.loadEventEnd - navigationTiming.startTime,
            domInteractive: navigationTiming.domInteractive - navigationTiming.startTime,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 'N/A'
          })
        }
      } catch (error) {
        simpleLogger.error('Failed to log performance metrics', { error: String(error) })
      }
    }
  }, [])

  return null
}
