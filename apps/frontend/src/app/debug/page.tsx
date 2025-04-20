'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SimpleLogger, simpleLogger } from '@/components/debug/SimpleLogger'
import { ApiDebugger } from '@/components/debug/ApiDebugger'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState('app-logs')
  const [systemInfo, setSystemInfo] = useState({
    reactVersion: '',
    nextVersion: '',
    nodeEnv: '',
    browserInfo: '',
    screenSize: ''
  })
  const [errorBoundaryTest, setErrorBoundaryTest] = useState(false)

  useEffect(() => {
    // Log page load
    simpleLogger.info('Debug page loaded')

    // Collect system information
    const collectSystemInfo = () => {
      try {
        // Get React version
        let reactVersion = 'Unknown'
        try {
          const reactModule = require('react')
          reactVersion = reactModule.version
        } catch (error) {
          simpleLogger.error('Failed to get React version', { error: String(error) })
        }

        // Get Next.js version
        let nextVersion = 'Unknown'
        try {
          const nextPackage = require('next/package.json')
          nextVersion = nextPackage.version
        } catch (error) {
          simpleLogger.error('Failed to get Next.js version', { error: String(error) })
        }

        // Browser and screen info
        const browserInfo = navigator.userAgent
        const screenSize = `${window.innerWidth}x${window.innerHeight}`

        setSystemInfo({
          reactVersion,
          nextVersion,
          nodeEnv: process.env.NODE_ENV || 'Unknown',
          browserInfo,
          screenSize
        })

        simpleLogger.info('System information collected', {
          react: reactVersion,
          next: nextVersion,
          node: process.env.NODE_ENV,
          browser: browserInfo,
          screen: screenSize
        })
      } catch (error) {
        simpleLogger.error('Failed to collect system information', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    collectSystemInfo()

    // Test imports to see if they cause errors
    const testImports = async () => {
      simpleLogger.startTimer('import-tests')

      try {
        // Test importing components
        await import('@/components/ui/tabs')
        simpleLogger.info('Successfully imported tabs')
      } catch (error) {
        simpleLogger.error('Error importing tabs', { error: String(error) })
      }

      try {
        await import('chart.js')
        simpleLogger.info('Successfully imported chart.js')
      } catch (error) {
        simpleLogger.error('Error importing chart.js', { error: String(error) })
      }

      try {
        await import('react-chartjs-2')
        simpleLogger.info('Successfully imported react-chartjs-2')
      } catch (error) {
        simpleLogger.error('Error importing react-chartjs-2', { error: String(error) })
      }

      try {
        await import('date-fns')
        simpleLogger.info('Successfully imported date-fns')
      } catch (error) {
        simpleLogger.error('Error importing date-fns', { error: String(error) })
      }

      simpleLogger.endTimer('import-tests')
    }

    testImports()
  }, [])

  // Test error boundary
  const triggerErrorBoundary = () => {
    setErrorBoundaryTest(true)
  }

  // If error boundary test is active, throw an error
  if (errorBoundaryTest) {
    throw new Error('This is a test error from the debug page')
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Debug & Diagnostics" description="Monitor and troubleshoot application issues" />
        <div className="flex items-center space-x-2">
          <Badge variant="outline">React: {systemInfo.reactVersion}</Badge>
          <Badge variant="outline">Next.js: {systemInfo.nextVersion}</Badge>
          <Badge variant="outline">Node Env: {systemInfo.nodeEnv}</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="app-logs">Application Logs</TabsTrigger>
          <TabsTrigger value="api-diagnostics">API Diagnostics</TabsTrigger>
          <TabsTrigger value="system-info">System Info</TabsTrigger>
          <TabsTrigger value="error-testing">Error Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="app-logs" className="space-y-4">
          <SimpleLogger />
        </TabsContent>

        <TabsContent value="api-diagnostics" className="space-y-4">
          <ApiDebugger />
        </TabsContent>

        <TabsContent value="system-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Details about the current environment and browser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Environment</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium">React Version</div>
                        <div>{systemInfo.reactVersion}</div>

                        <div className="font-medium">Next.js Version</div>
                        <div>{systemInfo.nextVersion}</div>

                        <div className="font-medium">Node Environment</div>
                        <div>{systemInfo.nodeEnv}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Browser</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="font-medium">User Agent</div>
                        <div className="text-sm break-words">{systemInfo.browserInfo}</div>

                        <div className="font-medium">Screen Size</div>
                        <div>{systemInfo.screenSize}</div>

                        <div className="font-medium">Language</div>
                        <div>{navigator.language}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">NEXT_PUBLIC_API_URL</div>
                    <div>{process.env.NEXT_PUBLIC_API_URL || 'Not set'}</div>

                    <div className="font-medium">NEXT_PUBLIC_VAPI_API_URL</div>
                    <div>{process.env.NEXT_PUBLIC_VAPI_API_URL || 'Not set'}</div>

                    <div className="font-medium">NEXT_PUBLIC_VAPI_API_KEY</div>
                    <div>{process.env.NEXT_PUBLIC_VAPI_API_KEY ? '✓ Present' : '✗ Missing'}</div>

                    <div className="font-medium">NEXT_PUBLIC_VAPI_ASSISTANT_ID</div>
                    <div>{process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ? '✓ Present' : '✗ Missing'}</div>

                    <div className="font-medium">NEXT_PUBLIC_SUPABASE_URL</div>
                    <div>{process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Present' : '✗ Missing'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="error-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Testing Tools</CardTitle>
              <CardDescription>
                Tools to test error handling and recovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Error Boundary Test</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  This will throw an error to test error boundaries
                </p>
                <Button
                  variant="destructive"
                  onClick={triggerErrorBoundary}
                >
                  Trigger Error
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Console Error Test</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  This will log errors to the console
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.error('Test console error')
                      simpleLogger.error('Test error message', { source: 'error-test-button' })
                    }}
                  >
                    Log Error
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.warn('Test console warning')
                      simpleLogger.warn('Test warning message', { source: 'warning-test-button' })
                    }}
                  >
                    Log Warning
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
