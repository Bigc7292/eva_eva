'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/lib/client-logger'

export default function ClientDebugPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Load logs on mount
  useEffect(() => {
    loadLogs()
    
    // Log page load
    clientLogger.info('Client debug page loaded', {
      url: window.location.href,
      userAgent: navigator.userAgent
    })
    
    // Log React version
    try {
      const React = require('react')
      clientLogger.info('React version', { version: React.version })
    } catch (error) {
      clientLogger.error('Failed to get React version', { error: String(error) })
    }
  }, [])
  
  // Load logs from API
  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-log')
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to load logs:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Clear logs
  const clearLogs = async () => {
    try {
      await fetch('/api/debug-log', { method: 'DELETE' })
      setLogs([])
      clientLogger.info('Logs cleared')
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }
  
  // Test logging
  const testLogging = () => {
    clientLogger.info('Info log test', { timestamp: new Date().toISOString() })
    clientLogger.warn('Warning log test', { timestamp: new Date().toISOString() })
    clientLogger.error('Error log test', { timestamp: new Date().toISOString() })
    clientLogger.debug('Debug log test', { timestamp: new Date().toISOString() })
    
    // Reload logs after a short delay
    setTimeout(loadLogs, 500)
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client-Side Logging</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button onClick={testLogging}>Test Logging</Button>
              <Button onClick={loadLogs} variant="outline">Refresh Logs</Button>
              <Button onClick={clearLogs} variant="outline">Clear Logs</Button>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Logs ({logs.length})</h3>
              
              {loading ? (
                <p>Loading logs...</p>
              ) : logs.length === 0 ? (
                <p>No logs available</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="border-b pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {log.level?.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
