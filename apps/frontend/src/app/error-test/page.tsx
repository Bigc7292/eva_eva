'use client'

import { useEffect, useState } from 'react'

export default function ErrorTestPage() {
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Override console.error to capture errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      setErrors(prev => [...prev, args.join(' ')])
      originalConsoleError(...args)
    }

    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)

    // Try to import and use components that might be causing errors
    try {
      import('@/components/dashboard/CallMetrics').catch(err => {
        console.error('Error importing CallMetrics:', err.message)
      })
      
      import('@/components/dashboard/CallQualityChart').catch(err => {
        console.error('Error importing CallQualityChart:', err.message)
      })
      
      import('@/components/dashboard/CallTrends').catch(err => {
        console.error('Error importing CallTrends:', err.message)
      })
      
      import('@/components/dashboard/DateRangeSelector').catch(err => {
        console.error('Error importing DateRangeSelector:', err.message)
      })
      
      import('@/components/dashboard/TeamPerformance').catch(err => {
        console.error('Error importing TeamPerformance:', err.message)
      })
    } catch (err) {
      console.error('Error in imports:', err)
    }

    // Restore original console.error on cleanup
    return () => {
      console.error = originalConsoleError
    }
  }, [])

  return (
    <div style={{ padding: '50px' }}>
      <h1 style={{ color: 'red', fontSize: '32px' }}>Error Test Page</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2>Detected Errors:</h2>
          {errors.length === 0 ? (
            <p style={{ color: 'green' }}>No errors detected!</p>
          ) : (
            <ul style={{ color: 'red', textAlign: 'left' }}>
              {errors.map((error, index) => (
                <li key={index} style={{ marginBottom: '10px', fontFamily: 'monospace' }}>
                  {error}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
