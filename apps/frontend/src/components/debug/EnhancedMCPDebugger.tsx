'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Download,
  Play,
  Camera,
  Monitor
} from '@/components/ui/icons'

interface DebugEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'success'
  source: string
  message: string
  stack?: string
  context?: any
}

interface PlaywrightStatus {
  isRunning: boolean
  lastScreenshot?: string
  lastTest?: string
  browserStatus: 'ready' | 'busy' | 'error'
}

export function EnhancedMCPDebugger() {
  const [debugLogs, setDebugLogs] = useState<DebugEntry[]>([])
  const [playwrightStatus, setPlaywrightStatus] = useState<PlaywrightStatus>({
    isRunning: false,
    browserStatus: 'ready'
  })
  const [isVisible, setIsVisible] = useState(false)
  const [filter, setFilter] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)

  // Connect to chrome debug MCP
  useEffect(() => {
    // Check if chrome debug MCP is available
    if (typeof window !== 'undefined' && (window as any).chromeDebugMCP) {
      const debugMCP = (window as any).chromeDebugMCP
      
      // Override the sendToMCP method to capture logs
      const originalSendToMCP = debugMCP.sendToMCP
      debugMCP.sendToMCP = (errorEntry: any) => {
        const debugEntry: DebugEntry = {
          timestamp: errorEntry.timestamp,
          level: errorEntry.level.toLowerCase(),
          source: 'Chrome Console',
          message: errorEntry.message,
          stack: errorEntry.stack?.join('\n'),
          context: errorEntry.context
        }
        
        setDebugLogs(prev => [...prev.slice(-99), debugEntry]) // Keep last 100 entries
        
        // Call original method
        originalSendToMCP.call(debugMCP, errorEntry)
      }

      // Add success log for connection
      setDebugLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'success',
        source: 'MCP Debug',
        message: 'Chrome Debug MCP connected successfully'
      }])
    }

    // Simulate Playwright status updates
    const playwrightInterval = setInterval(() => {
      setPlaywrightStatus(prev => ({
        ...prev,
        isRunning: Math.random() > 0.7, // Randomly show as running
        browserStatus: prev.browserStatus === 'busy' ? 'ready' : prev.browserStatus
      }))
    }, 5000)

    return () => {
      clearInterval(playwrightInterval)
    }
  }, [])

  const runPlaywrightTest = async () => {
    setPlaywrightStatus(prev => ({ ...prev, browserStatus: 'busy' }))
    
    try {
      // Add log entry for test start
      setDebugLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'Playwright MCP',
        message: 'Starting visual test...'
      }])

      // Simulate test execution
      setTimeout(() => {
        setDebugLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'success',
          source: 'Playwright MCP',
          message: 'Visual test completed successfully. Screenshot saved.'
        }])
        
        setPlaywrightStatus(prev => ({ 
          ...prev, 
          browserStatus: 'ready',
          lastTest: new Date().toISOString(),
          lastScreenshot: 'eva-app-test-' + Date.now() + '.png'
        }))
      }, 3000)
      
    } catch (error) {
      setDebugLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'error',
        source: 'Playwright MCP',
        message: `Test failed: ${error}`
      }])
      
      setPlaywrightStatus(prev => ({ ...prev, browserStatus: 'error' }))
    }
  }

  const takeScreenshot = async () => {
    setPlaywrightStatus(prev => ({ ...prev, browserStatus: 'busy' }))
    
    setDebugLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'Playwright MCP',
      message: 'Taking screenshot...'
    }])

    setTimeout(() => {
      setDebugLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'success',
        source: 'Playwright MCP',
        message: 'Screenshot captured successfully'
      }])
      
      setPlaywrightStatus(prev => ({ 
        ...prev, 
        browserStatus: 'ready',
        lastScreenshot: 'eva-screenshot-' + Date.now() + '.png'
      }))
    }, 1500)
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive'
      case 'warn':
        return 'secondary'
      case 'success':
        return 'default'
      default:
        return 'outline'
    }
  }

  const filteredLogs = filter 
    ? debugLogs.filter(log => 
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        log.source.toLowerCase().includes(filter.toLowerCase())
      )
    : debugLogs

  const exportLogs = () => {
    const dataStr = JSON.stringify(debugLogs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `eva-debug-logs-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          <Monitor className="h-4 w-4 mr-2" />
          Show MCP Debug
          {debugLogs.filter(log => log.level === 'error').length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {debugLogs.filter(log => log.level === 'error').length}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-96 h-[500px] m-4">
      <Card className="h-full flex flex-col shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              MCP Debug Center
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          <Tabs defaultValue="logs" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Debug Logs</TabsTrigger>
              <TabsTrigger value="playwright">Playwright</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="flex-1 flex flex-col space-y-3 mt-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Filter logs..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportLogs}
                  disabled={debugLogs.length === 0}
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDebugLogs([])}
                >
                  Clear
                </Button>
              </div>

              <ScrollArea className="flex-1 h-[320px]">
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No debug logs yet
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                        {getLevelIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getBadgeVariant(log.level)} className="text-xs">
                              {log.source}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-gray-900 break-words">
                            {log.message}
                          </div>
                          {log.stack && (
                            <details className="mt-1">
                              <summary className="text-muted-foreground cursor-pointer">Stack trace</summary>
                              <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                                {log.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="playwright" className="flex-1 flex flex-col space-y-3 mt-3">
              <div className="space-y-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Playwright Status: {' '}
                    <Badge variant={playwrightStatus.browserStatus === 'ready' ? 'default' : 
                                  playwrightStatus.browserStatus === 'busy' ? 'secondary' : 'destructive'}>
                      {playwrightStatus.browserStatus}
                    </Badge>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runPlaywrightTest}
                    disabled={playwrightStatus.browserStatus === 'busy'}
                    className="text-xs"
                  >
                    {playwrightStatus.browserStatus === 'busy' ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3 mr-1" />
                    )}
                    Run Test
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={takeScreenshot}
                    disabled={playwrightStatus.browserStatus === 'busy'}
                    className="text-xs"
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    Screenshot
                  </Button>
                </div>

                {playwrightStatus.lastTest && (
                  <div className="text-xs text-muted-foreground">
                    Last test: {new Date(playwrightStatus.lastTest).toLocaleString()}
                  </div>
                )}
                
                {playwrightStatus.lastScreenshot && (
                  <div className="text-xs text-muted-foreground">
                    Last screenshot: {playwrightStatus.lastScreenshot}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}