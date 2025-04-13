'use client'

import { useState, useEffect } from 'react'
import { Heading } from '@/components/ui/heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimpleLogger, simpleLogger } from '@/components/debug/SimpleLogger'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function DebugLogsPage() {
  const [activeTab, setActiveTab] = useState('app-logs')
  const [reactVersion, setReactVersion] = useState<string>('')
  const [nextVersion, setNextVersion] = useState<string>('')
  const [loadedModules, setLoadedModules] = useState<string[]>([])
  const [errorBoundaryTest, setErrorBoundaryTest] = useState(false)
  const [hookTest, setHookTest] = useState(false)

  useEffect(() => {
    // Log page load
    simpleLogger.info('Debug logs page loaded')

    // Get React version
    try {
      const reactModule = require('react')
      setReactVersion(reactModule.version)
      simpleLogger.info(`React version: ${reactModule.version}`)
    } catch (error) {
      simpleLogger.error('Failed to get React version', { error: String(error) })
    }

    // Get Next.js version
    try {
      const nextPackage = require('next/package.json')
      setNextVersion(nextPackage.version)
      simpleLogger.info(`Next.js version: ${nextPackage.version}`)
    } catch (error) {
      simpleLogger.error('Failed to get Next.js version', { error: String(error) })
    }

    // Get loaded modules
    try {
      const modules = Object.keys(require.cache || {})
        .filter(path => path.includes('node_modules'))
        .map(path => {
          const match = path.match(/node_modules[\/\\]([^\/\\]+)/)
          return match ? match[1] : path
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort()

      setLoadedModules(modules)
      simpleLogger.info(`Loaded ${modules.length} modules`)
    } catch (error) {
      simpleLogger.error('Failed to get loaded modules', { error: String(error) })
    }
  }, [])

  // Test error boundary
  const triggerErrorBoundary = () => {
    setErrorBoundaryTest(true)
  }

  // Test React hooks
  const triggerHookTest = () => {
    setHookTest(true)
  }

  // If error boundary test is active, throw an error
  if (errorBoundaryTest) {
    throw new Error('This is a test error from the debug page')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading title="Debug & Diagnostics" description="Monitor and troubleshoot application issues" />
        <div className="flex items-center space-x-2">
          <Badge variant="outline">React: {reactVersion || 'Unknown'}</Badge>
          <Badge variant="outline">Next.js: {nextVersion || 'Unknown'}</Badge>
          <Badge variant="outline">Node Env: {process.env.NODE_ENV}</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="app-logs">Application Logs</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="error-testing">Error Testing</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="app-logs" className="space-y-4">
          <SimpleLogger />
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loaded Modules</CardTitle>
              <CardDescription>
                Modules currently loaded in the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <div className="grid grid-cols-3 gap-2">
                  {loadedModules.map((module, index) => (
                    <Badge key={index} variant="outline" className="justify-start">
                      {module}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="error-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Testing Tools</CardTitle>
              <CardDescription>
                Tools to test error handling and React hooks
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
                <h3 className="text-lg font-medium mb-2">React Hook Test</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  This will test React hooks functionality
                </p>
                <Button
                  variant="outline"
                  onClick={triggerHookTest}
                >
                  Test Hooks
                </Button>

                {hookTest && <HookTestComponent />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Current environment configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">NODE_ENV</div>
                  <div>{process.env.NODE_ENV}</div>

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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Hook test component
function HookTestComponent() {
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      simpleLogger.info('Hook test component mounted')

      // Test useState
      setCount(1)

      // Test useReducer indirectly
      const testReducer = () => {
        try {
          const React = require('react')
          const [state, dispatch] = React.useReducer((state: number, action: string) => {
            if (action === 'increment') return state + 1
            return state
          }, 0)

          simpleLogger.info('useReducer test passed', { state })
          return true
        } catch (error) {
          simpleLogger.error('useReducer test failed', { error: String(error) })
          setError(`useReducer error: ${error instanceof Error ? error.message : String(error)}`)
          return false
        }
      }

      testReducer()
    } catch (error) {
      simpleLogger.error('Hook test failed', { error: String(error) })
      setError(`Hook test error: ${error instanceof Error ? error.message : String(error)}`)
    }

    return () => {
      simpleLogger.info('Hook test component unmounted')
    }
  }, [])

  return (
    <div className="mt-4 p-4 border rounded-md">
      <h4 className="font-medium">Hook Test Results</h4>
      {error ? (
        <div className="mt-2 text-red-500">{error}</div>
      ) : (
        <div className="mt-2 text-green-500">
          useState test passed: count = {count}
        </div>
      )}
    </div>
  )
}
