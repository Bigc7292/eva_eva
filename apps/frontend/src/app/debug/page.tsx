'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState('console')
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
        logger.info('Successfully imported tabs', 'Imports')
      } catch (error) {
        logger.error('Error importing tabs', 'Imports', error)
      }

      try {
        await import('chart.js')
        logger.info('Successfully imported chart.js', 'Imports')
      } catch (error) {
        logger.error('Error importing chart.js', 'Imports', error)
      }

      try {
        await import('react-chartjs-2')
        logger.info('Successfully imported react-chartjs-2', 'Imports')
      } catch (error) {
        logger.error('Error importing react-chartjs-2', 'Imports', error)
      }

      try {
        await import('date-fns')
        logger.info('Successfully imported date-fns', 'Imports')
      } catch (error) {
        logger.error('Error importing date-fns', 'Imports', error)
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
        <Heading title="Debug Console" description="Monitor and debug application services" />
        <Button onClick={clearLogs}>Clear Logs</Button>
      </div>

      <Tabs defaultValue="console" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="console">Console Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="console" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Console Logs</h2>
            <p className="text-muted-foreground mb-6">
              View console logs, warnings, and errors captured from the application.
            </p>

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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
