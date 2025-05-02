'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Download, Trash } from 'lucide-react'

export function CallLogsViewer() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Function to fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/calls/logs')
      if (!response.ok) {
        throw new Error('Failed to fetch logs')
      }
      const data = await response.json()
      setLogs(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError('Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  // Function to clear logs
  const clearLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/calls/logs/clear', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to clear logs')
      }
      setLogs([])
      setError(null)
    } catch (err) {
      console.error('Error clearing logs:', err)
      setError('Failed to clear logs')
    } finally {
      setLoading(false)
    }
  }

  // Function to download logs
  const downloadLogs = () => {
    const content = logs.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Set up polling for logs if autoRefresh is enabled
  useEffect(() => {
    // Initial fetch
    fetchLogs()

    // Set up polling interval if autoRefresh is enabled
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000)
    }

    // Clean up interval on component unmount or when autoRefresh changes
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [autoRefresh])

  // Function to toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Call Logs</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAutoRefresh}
            className={autoRefresh ? 'bg-primary/10' : ''}
          >
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={downloadLogs} disabled={logs.length === 0}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && logs.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading logs...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-destructive">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">No logs available</p>
          </div>
        ) : (
          <div className="bg-muted p-4 rounded-md h-64 overflow-y-auto font-mono text-xs">
            {logs.map((log, index) => {
              // Determine log level for styling
              let className = 'text-foreground'
              if (log.includes('[ERROR]')) {
                className = 'text-destructive'
              } else if (log.includes('[WARNING]')) {
                className = 'text-amber-500'
              } else if (log.includes('[INFO]')) {
                className = 'text-blue-500'
              } else if (log.includes('[DEBUG]')) {
                className = 'text-green-500'
              }
              
              return (
                <div key={index} className={`${className} mb-1`}>
                  {log}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
