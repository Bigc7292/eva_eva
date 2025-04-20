'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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

// Maximum number of logs to keep in memory
const MAX_LOGS = 1000

// Performance timers storage
const timers: Record<string, number> = {}

// Create a global logger function
export const simpleLogger = {
  info: (message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: new Date(), level: 'info' as const, message, details }
    addLogEntry(entry)
    console.info(`[SIMPLE-LOGGER][INFO] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  warn: (message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: new Date(), level: 'warn' as const, message, details }
    addLogEntry(entry)
    console.warn(`[SIMPLE-LOGGER][WARN] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  error: (message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: new Date(), level: 'error' as const, message, details }
    addLogEntry(entry)
    console.error(`[SIMPLE-LOGGER][ERROR] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  debug: (message: string, details?: Record<string, unknown>) => {
    const entry = { timestamp: new Date(), level: 'debug' as const, message, details }
    addLogEntry(entry)
    console.debug(`[SIMPLE-LOGGER][DEBUG] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  // Timer functions for performance measurement
  startTimer: (label: string) => {
    timers[label] = performance.now()
    simpleLogger.debug(`Timer started: ${label}`)
  },
  endTimer: (label: string) => {
    if (timers[label]) {
      const duration = performance.now() - timers[label]
      simpleLogger.info(`Timer ended: ${label}`, { duration: `${duration.toFixed(2)}ms` })
      delete timers[label]
      return duration
    } else {
      simpleLogger.warn(`Timer ended but not started: ${label}`)
      return 0
    }
  },
  // API logging helpers
  logApiRequest: (url: string, method: string, data?: any) => {
    simpleLogger.info(`API Request: ${method} ${url}`, { data })
    return { timestamp: performance.now(), url, method }
  },
  logApiResponse: (requestInfo: { timestamp: number, url: string, method: string }, status: number, data?: any) => {
    const duration = performance.now() - requestInfo.timestamp
    simpleLogger.info(`API Response: ${requestInfo.method} ${requestInfo.url}`, {
      status,
      duration: `${duration.toFixed(2)}ms`,
      data
    })
  },
  // Log management
  getLogs: () => [...globalLogs],
  getLogsByLevel: (level: 'info' | 'warn' | 'error' | 'debug') => {
    return globalLogs.filter(log => log.level === level)
  },
  search: (term: string) => {
    const searchTerm = term.toLowerCase()
    return globalLogs.filter(log =>
      log.message.toLowerCase().includes(searchTerm) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm)
    )
  },
  clear: () => {
    globalLogs = []
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-logs-cleared'))
    }
  },
  // Export logs
  exportLogs: (format: 'json' | 'csv' = 'json') => {
    if (format === 'json') {
      return JSON.stringify(globalLogs, null, 2)
    } else {
      // CSV format
      const header = 'timestamp,level,message,details\n'
      const rows = globalLogs.map(log => {
        const timestamp = log.timestamp.toISOString()
        const level = log.level
        const message = `"${log.message.replace(/"/g, '""')}"`
        const details = log.details ? `"${JSON.stringify(log.details).replace(/"/g, '""')}"` : ''
        return `${timestamp},${level},${message},${details}`
      }).join('\n')
      return header + rows
    }
  }
}

// Helper function to add log entry and maintain max size
function addLogEntry(entry: LogEntry) {
  globalLogs.push(entry)
  // Keep logs under the maximum size
  if (globalLogs.length > MAX_LOGS) {
    globalLogs = globalLogs.slice(-MAX_LOGS)
  }
}

export function SimpleLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all')
  const [search, setSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Handler for new logs
    const handleNewLog = (event: CustomEvent<LogEntry>) => {
      setLogs(prevLogs => {
        const newLogs = [...prevLogs, event.detail]
        // Keep UI logs under a reasonable limit to prevent performance issues
        if (newLogs.length > 500) {
          return newLogs.slice(-500)
        }
        return newLogs
      })
    }

    // Handler for clearing logs
    const handleClearLogs = () => {
      setLogs([])
    }

    // Add event listeners
    window.addEventListener('app-log', handleNewLog as EventListener)
    window.addEventListener('app-logs-cleared', handleClearLogs)

    // Log initial environment information
    simpleLogger.info('Logger initialized', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      url: window.location.href
    })

    // Cleanup
    return () => {
      window.removeEventListener('app-log', handleNewLog as EventListener)
      window.removeEventListener('app-logs-cleared', handleClearLogs)
    }
  }, [])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = logs

    // Apply level filter
    if (filter !== 'all') {
      filtered = filtered.filter(log => log.level === filter)
    }

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm))
      )
    }

    return filtered
  }, [logs, filter, search])

  // Clear logs
  const clearLogs = () => {
    simpleLogger.clear()
  }

  // Export logs
  const exportLogs = (format: 'json' | 'csv') => {
    const content = simpleLogger.exportLogs(format)
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <input
              type="text"
              placeholder="Search logs..."
              className="px-2 py-1 text-sm border rounded-md w-40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="px-2 py-1 text-sm border rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportLogs('json')}
            >
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportLogs('csv')}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              <span>Auto-scroll</span>
            </label>
          </div>
        </div>
        <div ref={logContainerRef} className="h-[500px] border rounded-md p-4 overflow-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No logs to display
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, i) => (
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
