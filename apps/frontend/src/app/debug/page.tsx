'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'

export default function DebugPage() {
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  
  useEffect(() => {
    // Override console methods to capture logs
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    const originalConsoleLog = console.log
    
    console.error = (...args) => {
      setErrors(prev => [...prev, args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')])
      originalConsoleError(...args)
    }
    
    console.warn = (...args) => {
      setWarnings(prev => [...prev, args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')])
      originalConsoleWarn(...args)
    }
    
    console.log = (...args) => {
      setLogs(prev => [...prev, args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')])
      originalConsoleLog(...args)
    }
    
    // Test imports to see if they cause errors
    const testImports = async () => {
      try {
        // Test importing components
        await import('@/components/ui/tabs')
        console.log('Successfully imported tabs')
      } catch (error) {
        console.error('Error importing tabs:', error)
      }
      
      try {
        await import('@/components/dashboard/CallMetrics')
        console.log('Successfully imported CallMetrics')
      } catch (error) {
        console.error('Error importing CallMetrics:', error)
      }
      
      try {
        await import('chart.js')
        console.log('Successfully imported chart.js')
      } catch (error) {
        console.error('Error importing chart.js:', error)
      }
      
      try {
        await import('react-chartjs-2')
        console.log('Successfully imported react-chartjs-2')
      } catch (error) {
        console.error('Error importing react-chartjs-2:', error)
      }
      
      try {
        await import('date-fns')
        console.log('Successfully imported date-fns')
      } catch (error) {
        console.error('Error importing date-fns:', error)
      }
    }
    
    testImports()
    
    // Restore original console methods on cleanup
    return () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      console.log = originalConsoleLog
    }
  }, [])
  
  const clearLogs = () => {
    setErrors([])
    setWarnings([])
    setLogs([])
  }
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Debug Page" description="View console errors and warnings" />
        <Button onClick={clearLogs}>Clear Logs</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1">
        {errors.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Errors ({errors.length})</h2>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="p-2 bg-red-50 rounded border border-red-200 overflow-x-auto">
                  <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {warnings.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-yellow-600 mb-4">Warnings ({warnings.length})</h2>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 rounded border border-yellow-200 overflow-x-auto">
                  <pre className="text-sm text-yellow-800 whitespace-pre-wrap">{warning}</pre>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {logs.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-blue-600 mb-4">Logs ({logs.length})</h2>
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="p-2 bg-blue-50 rounded border border-blue-200 overflow-x-auto">
                  <pre className="text-sm text-blue-800 whitespace-pre-wrap">{log}</pre>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {errors.length === 0 && warnings.length === 0 && logs.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No logs captured yet.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
