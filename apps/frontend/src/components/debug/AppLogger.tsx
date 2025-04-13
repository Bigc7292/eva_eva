'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Download, Trash, Play, Pause } from 'lucide-react'

// Define log entry type
interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  details?: any
}

// Global log collection
let globalLogs: LogEntry[] = []

// Create a global logger function
export const appLogger = {
  info: (message: string, details?: any) => {
    const entry = { timestamp: new Date(), level: 'info' as const, message, details }
    globalLogs.push(entry)
    console.info(`[APP-LOGGER][INFO] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  warn: (message: string, details?: any) => {
    const entry = { timestamp: new Date(), level: 'warn' as const, message, details }
    globalLogs.push(entry)
    console.warn(`[APP-LOGGER][WARN] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  error: (message: string, details?: any) => {
    const entry = { timestamp: new Date(), level: 'error' as const, message, details }
    globalLogs.push(entry)
    console.error(`[APP-LOGGER][ERROR] ${message}`, details || '')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-log', { detail: entry }))
    }
  },
  debug: (message: string, details?: any) => {
    const entry = { timestamp: new Date(), level: 'debug' as const, message, details }
    globalLogs.push(entry)
    console.debug(`[APP-LOGGER][DEBUG] ${message}`, details || '')
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

// Intercept console methods
export function setupConsoleInterceptor() {
  // Skip in server-side rendering
  if (typeof window === 'undefined') {
    return;
  }

  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  }

  // Helper to safely stringify objects
  const safeStringify = (obj: any): string => {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj !== 'object') return String(obj);

    try {
      return JSON.stringify(obj);
    } catch (e) {
      return '[Object cannot be stringified]';
    }
  };

  // Override console methods
  console.log = (...args: any[]) => {
    const message = args.map(safeStringify).join(' ');
    appLogger.debug(`Console.log: ${message}`);
    originalConsole.log.apply(console, args);
  };

  console.info = (...args: any[]) => {
    const message = args.map(safeStringify).join(' ');
    appLogger.info(`Console.info: ${message}`);
    originalConsole.info.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args.map(safeStringify).join(' ');
    appLogger.warn(`Console.warn: ${message}`);
    originalConsole.warn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args.map(safeStringify).join(' ');
    appLogger.error(`Console.error: ${message}`);
    originalConsole.error.apply(console, args);
  };

  console.debug = (...args: any[]) => {
    const message = args.map(safeStringify).join(' ');
    appLogger.debug(`Console.debug: ${message}`);
    originalConsole.debug.apply(console, args);
  };

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    appLogger.error('Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack || event.error
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    appLogger.error('Unhandled promise rejection', {
      reason: event.reason?.stack || event.reason
    });
  });
}

export function AppLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isCapturing, setIsCapturing] = useState(true)
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Setup console interceptor
    setupConsoleInterceptor()

    // Log initial environment information
    logEnvironmentInfo()

    // Handler for new logs
    const handleNewLog = (event: CustomEvent<LogEntry>) => {
      if (isCapturing) {
        setLogs(prevLogs => [...prevLogs, event.detail])
      }
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
  }, [isCapturing])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [logs])

  // Log environment information
  const logEnvironmentInfo = () => {
    appLogger.info('App initialization started')
    appLogger.info('Environment variables', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_VAPI_API_KEY: process.env.NEXT_PUBLIC_VAPI_API_KEY ? '✓ Present' : '✗ Missing',
      NEXT_PUBLIC_VAPI_ASSISTANT_ID: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ? '✓ Present' : '✗ Missing',
      NEXT_PRIVATE_VAPI_API_KEY: process.env.NEXT_PRIVATE_VAPI_API_KEY ? '✓ Present' : '✗ Missing',
      NEXT_PUBLIC_VAPI_API_URL: process.env.NEXT_PUBLIC_VAPI_API_URL,
      NEXT_PUBLIC_VOICEGENIE_API_KEY: process.env.NEXT_PUBLIC_VOICEGENIE_API_KEY ? '✓ Present' : '✗ Missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Present' : '✗ Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Present' : '✗ Missing'
    })
    appLogger.info('Browser information', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor
    })
  }

  // Download logs as JSON
  const downloadLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportName = `app-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportName)
    linkElement.click()
  }

  // Clear logs
  const clearLogs = () => {
    appLogger.clear()
  }

  // Toggle capturing
  const toggleCapturing = () => {
    setIsCapturing(!isCapturing)
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.level === filter
  })

  // Get badge color based on log level
  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-500'
      case 'warn': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'debug': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Application Logger</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCapturing}
          >
            {isCapturing ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {isCapturing ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
          >
            <Trash className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadLogs}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-2">
          <Badge
            className={`cursor-pointer ${filter === 'all' ? 'bg-primary' : 'bg-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All ({logs.length})
          </Badge>
          <Badge
            className={`cursor-pointer ${filter === 'info' ? 'bg-blue-500' : 'bg-secondary'}`}
            onClick={() => setFilter('info')}
          >
            Info ({logs.filter(log => log.level === 'info').length})
          </Badge>
          <Badge
            className={`cursor-pointer ${filter === 'warn' ? 'bg-yellow-500' : 'bg-secondary'}`}
            onClick={() => setFilter('warn')}
          >
            Warnings ({logs.filter(log => log.level === 'warn').length})
          </Badge>
          <Badge
            className={`cursor-pointer ${filter === 'error' ? 'bg-red-500' : 'bg-secondary'}`}
            onClick={() => setFilter('error')}
          >
            Errors ({logs.filter(log => log.level === 'error').length})
          </Badge>
          <Badge
            className={`cursor-pointer ${filter === 'debug' ? 'bg-gray-500' : 'bg-secondary'}`}
            onClick={() => setFilter('debug')}
          >
            Debug ({logs.filter(log => log.level === 'debug').length})
          </Badge>
        </div>
        <ScrollArea className="h-[500px] border rounded-md p-4" ref={scrollAreaRef}>
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No logs to display
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div key={index} className="border-b pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <Badge className={getBadgeColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{log.message}</p>
                  {log.details && (
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details, null, 2)
                        : String(log.details)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
