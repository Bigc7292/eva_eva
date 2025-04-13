'use client'

import { useState, useEffect } from 'react'
import { simpleLogger } from '@/components/debug/SimpleLogger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestLoggerPage() {
  const [logs, setLogs] = useState<Array<{
    timestamp: Date;
    level: string;
    message: string;
    details?: any;
  }>>([])
  
  useEffect(() => {
    // Log page load
    simpleLogger.info('Test Logger page loaded')
    
    // Handler for new logs
    const handleNewLog = (event: CustomEvent<any>) => {
      setLogs(prevLogs => [...prevLogs, event.detail])
    }
    
    // Handler for clearing logs
    const handleClearLogs = () => {
      setLogs([])
    }
    
    // Add event listeners
    window.addEventListener('app-log', handleNewLog as EventListener)
    window.addEventListener('app-logs-cleared', handleClearLogs)
    
    // Cleanup
    return () => {
      window.removeEventListener('app-log', handleNewLog as EventListener)
      window.removeEventListener('app-logs-cleared', handleClearLogs)
    }
  }, [])
  
  const logTestInfo = () => {
    simpleLogger.info('Info log test', { timestamp: new Date().toISOString() })
  }
  
  const logTestWarning = () => {
    simpleLogger.warn('Warning log test', { timestamp: new Date().toISOString() })
  }
  
  const logTestError = () => {
    simpleLogger.error('Error log test', { timestamp: new Date().toISOString() })
  }
  
  const logTestDebug = () => {
    simpleLogger.debug('Debug log test', { timestamp: new Date().toISOString() })
  }
  
  const clearLogs = () => {
    simpleLogger.clear()
  }
  
  // Get color based on log level
  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-500'
      case 'warn': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      case 'debug': return 'text-gray-500'
      default: return 'text-blue-500'
    }
  }
  
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">SimpleLogger Test Page</h1>
      
      <div className="flex space-x-2">
        <Button onClick={logTestInfo} variant="outline">Log Info</Button>
        <Button onClick={logTestWarning} variant="outline">Log Warning</Button>
        <Button onClick={logTestError} variant="outline">Log Error</Button>
        <Button onClick={logTestDebug} variant="outline">Log Debug</Button>
        <Button onClick={clearLogs} variant="outline">Clear Logs</Button>
      </div>
      
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Application Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] border rounded-md p-4 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No logs to display
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={`${log.timestamp.getTime()}-${i}`} className="border-b pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${getLogColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{log.message}</p>
                    {log.details && (
                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
