'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { logger, LogEntry } from '@/lib/services/logger'
import { ApiMonitor } from './ApiMonitor'
import { DatabaseMonitor } from './DatabaseMonitor'
import { WebhookMonitor } from './WebhookMonitor'
import { ServiceStatus } from './ServiceStatus'

export function DebugDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeTab, setActiveTab] = useState('logs')
  const [filter, setFilter] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Initialize with existing logs
    setLogs(logger.getLogs())

    // Subscribe to new logs
    const unsubscribe = logger.subscribe((entry) => {
      setLogs(prev => [...prev, entry])
    })

    return () => unsubscribe()
  }, [])

  const clearLogs = () => {
    logger.clearLogs()
    setLogs([])
  }

  const exportLogs = () => {
    const blob = new Blob([logger.exportLogs()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredLogs = filter
    ? logs.filter(log =>
        log.module.toLowerCase().includes(filter.toLowerCase()) ||
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(filter.toLowerCase()))
      )
    : logs

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={toggleVisibility} variant="outline" size="sm">
          Show Debug Panel
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-0 right-0 z-50 transition-all duration-300 ${expanded ? 'w-full md:w-3/4 lg:w-2/3 h-2/3' : 'w-64 h-12'}`}>
      <div className="bg-background border rounded-t-lg shadow-lg h-full flex flex-col">
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center">
            <h3 className="text-sm font-semibold">Debug Dashboard</h3>
            {!expanded && (
              <Badge variant="outline" className="ml-2">
                {logs.filter(log => log.level === 'error').length} Errors
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="h-6 w-6">
              {expanded ? '−' : '+'}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleVisibility} className="h-6 w-6">
              ×
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="logs" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="border-b px-4">
                <TabsList>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                  <TabsTrigger value="api">API Calls</TabsTrigger>
                  <TabsTrigger value="database">Database</TabsTrigger>
                  <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                  <TabsTrigger value="status">Service Status</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="logs" className="flex-1 overflow-hidden p-4">
                <div className="flex justify-between mb-2">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={filter === null ? "default" : "outline"}
                      onClick={() => setFilter(null)}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'VAPI' ? "default" : "outline"}
                      onClick={() => setFilter('VAPI')}
                    >
                      VAPI
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'Twilio' ? "default" : "outline"}
                      onClick={() => setFilter('Twilio')}
                    >
                      Twilio
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'Supabase' ? "default" : "outline"}
                      onClick={() => setFilter('Supabase')}
                    >
                      Supabase
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'Calendar' ? "default" : "outline"}
                      onClick={() => setFilter('Calendar')}
                    >
                      Calendar
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'Email' ? "default" : "outline"}
                      onClick={() => setFilter('Email')}
                    >
                      Email
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={clearLogs}>
                      Clear
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportLogs}>
                      Export
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100%-40px)] border rounded-md">
                  <div className="p-4 space-y-2">
                    {filteredLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No logs to display
                      </div>
                    ) : (
                      filteredLogs.map((log, index) => (
                        <LogItem key={index} log={log} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="api" className="flex-1 overflow-hidden">
                <ApiMonitor />
              </TabsContent>

              <TabsContent value="database" className="flex-1 overflow-hidden">
                <DatabaseMonitor />
              </TabsContent>

              <TabsContent value="webhooks" className="flex-1 overflow-hidden">
                <WebhookMonitor />
              </TabsContent>

              <TabsContent value="status" className="flex-1 overflow-hidden">
                <ServiceStatus />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

interface LogItemProps {
  log: LogEntry
}

function LogItem({ log }: LogItemProps) {
  const [expanded, setExpanded] = useState(false)

  const levelColors: Record<string, string> = {
    debug: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  const hasData = log.data && Object.keys(log.data).length > 0

  return (
    <div className={`p-2 rounded-md ${levelColors[log.level]}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-2">
          <Badge variant="outline" className="uppercase text-xs">
            {log.level}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {log.module}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {hasData && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="h-5 w-5 -mt-1"
          >
            {expanded ? '−' : '+'}
          </Button>
        )}
      </div>

      <div className="mt-1">
        <p className="text-sm">{log.message}</p>

        {expanded && hasData && (
          <pre className="mt-2 p-2 bg-background/50 rounded text-xs overflow-x-auto">
            {JSON.stringify(log.data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
