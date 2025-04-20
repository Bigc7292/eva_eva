'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { simpleLogger } from '@/components/debug/SimpleLogger'

// Create a context for the logger
const LoggerContext = createContext<typeof simpleLogger | null>(null)

// Hook to use the logger
export const useLogger = () => {
  const context = useContext(LoggerContext)
  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider')
  }
  return context
}

// Logger Provider component
export function LoggerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Log application startup
    simpleLogger.info('Application initialized', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      environment: process.env.NODE_ENV
    })

    // Log performance metrics
    if (typeof window !== 'undefined' && window.performance) {
      try {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

        if (navigationTiming) {
          const metrics = {
            dnsLookup: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
            tcpConnection: navigationTiming.connectEnd - navigationTiming.connectStart,
            requestTime: navigationTiming.responseStart - navigationTiming.requestStart,
            responseTime: navigationTiming.responseEnd - navigationTiming.responseStart,
            domProcessing: navigationTiming.domComplete - navigationTiming.domInteractive,
            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
            loadEvent: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
            totalPageLoad: navigationTiming.loadEventEnd - navigationTiming.startTime
          }

          simpleLogger.info('Performance metrics', metrics)
        }
      } catch (error) {
        simpleLogger.error('Failed to collect performance metrics', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Set up global error handler
    const originalOnError = window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      simpleLogger.error('Uncaught error', {
        message,
        source,
        lineno,
        colno,
        stack: error?.stack
      })

      // Call the original handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError(message, source, lineno, colno, error)
      }

      // Return false to allow the default browser error handling
      return false
    }

    // Set up unhandled promise rejection handler
    const originalOnUnhandledRejection = window.onunhandledrejection
    window.onunhandledrejection = (event) => {
      simpleLogger.error('Unhandled promise rejection', {
        reason: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      })

      // Call the original handler if it exists
      if (typeof originalOnUnhandledRejection === 'function') {
        return originalOnUnhandledRejection(event)
      }
    }

    // Set up fetch interceptor
    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')

      const requestInfo = simpleLogger.logApiRequest(url, method, init?.body)

      try {
        const response = await originalFetch(input, init)

        // Clone the response to avoid consuming it
        const clonedResponse = response.clone()

        // Try to parse the response body
        let responseData
        try {
          const contentType = clonedResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            responseData = await clonedResponse.json()
          } else {
            responseData = { type: contentType, status: clonedResponse.status }
          }
        } catch (error) {
          responseData = { error: 'Could not parse response body' }
        }

        simpleLogger.logApiResponse(requestInfo, response.status, responseData)

        return response
      } catch (error) {
        simpleLogger.error(`Fetch error: ${url}`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
        throw error
      }
    }

    // Cleanup function
    return () => {
      // Restore original handlers
      window.onerror = originalOnError
      window.onunhandledrejection = originalOnUnhandledRejection
      window.fetch = originalFetch

      simpleLogger.info('Application cleanup')
    }
  }, [])

  return (
    <LoggerContext.Provider value={simpleLogger}>
      {children}
    </LoggerContext.Provider>
  )
}
