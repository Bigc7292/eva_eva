'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Define log entry type
interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  details?: Record<string, unknown>
}

// Global log collection
let globalLogs: LogEntry[] = []

// Create a global logger function
export const simpleLogger = {
  info: (message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: new Date(), level: 'info' as const, message, details }
    globalLogs.push(entry)
    console.info(`[SIMPLE-LOGGER][INFO] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  warn: (message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: new Date(), level: 'warn' as const, message, details }
    globalLogs.push(entry)
    console.warn(`[SIMPLE-LOGGER][WARN] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  error: (message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: new Date(), level: 'error' as const, message, details }
    globalLogs.push(entry)
    console.error(`[SIMPLE-LOGGER][ERROR] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  debug: (message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: new Date(), level: 'debug' as const, message, details }
    globalLogs.push(entry)
    console.debug(`[SIMPLE-LOGGER][DEBUG] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  getLogs: () => [...globalLogs],
  clear: () => {
    globalLogs = []
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-logs-cleared'))
    }
  }
}

export function SimpleLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  
  useEffect(() => {
    // Handler for new logs
    const handleNewLog = (event: CustomEvent<LogEntry>) => {
      setLogs(prevLogs => [...prevLogs, event.detail])
    }

    // Handler for clearing logs
    const handleClearLogs = () => {
      setLogs([])
    }

    // Add event listeners
    window.addEventListener('app-log', handleNewLog as EventListener)
    window.addEventListener('app-logs-cleared', handleClearLogs)

    // Log initial environment information
    simpleLogger.info('Logger initialized')
    
    // Cleanup
    return () => {
      window.removeEventListener('app-log', handleNewLog as EventListener)
      window.removeEventListener('app-logs-cleared', handleClearLogs)
    }
  }, [])

  // Clear logs
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Application Logs</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearLogs}
        >
          Clear
        </Button>
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
  )
}
