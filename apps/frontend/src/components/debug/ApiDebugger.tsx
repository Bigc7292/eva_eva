'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { simpleLogger } from './SimpleLogger'

interface ApiTestResult {
  endpoint: string
  method: string
  status: number
  duration: number
  success: boolean
  response?: any
  error?: string
}

export function ApiDebugger() {
  const [results, setResults] = useState<ApiTestResult[]>([])
  const [testing, setTesting] = useState(false)
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [customMethod, setCustomMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET')
  const [customBody, setCustomBody] = useState('')
  const [customBodyValid, setCustomBodyValid] = useState(true)

  // Validate JSON body
  useEffect(() => {
    if (!customBody) {
      setCustomBodyValid(true)
      return
    }
    
    try {
      JSON.parse(customBody)
      setCustomBodyValid(true)
    } catch (e) {
      setCustomBodyValid(false)
    }
  }, [customBody])

  // Test a single API endpoint
  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any): Promise<ApiTestResult> => {
    const startTime = performance.now()
    const requestInfo = simpleLogger.logApiRequest(endpoint, method, body)
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body)
      }
      
      const response = await fetch(endpoint, options)
      const data = await response.json()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      const result = {
        endpoint,
        method,
        status: response.status,
        duration,
        success: response.ok,
        response: data
      }
      
      simpleLogger.logApiResponse(requestInfo, response.status, data)
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      simpleLogger.error(`API test failed: ${endpoint}`, { error: errorMessage })
      
      return {
        endpoint,
        method,
        status: 0,
        duration,
        success: false,
        error: errorMessage
      }
    }
  }

  // Test all API endpoints
  const testAllEndpoints = async () => {
    setTesting(true)
    setResults([])
    
    try {
      simpleLogger.info('Starting API diagnostics test')
      simpleLogger.startTimer('api-diagnostics')
      
      // Define endpoints to test
      const endpoints = [
        { url: '/api/health', method: 'GET' },
        { url: '/api/outbound-calls', method: 'POST', body: { phoneNumber: '+15555555555', name: 'Test User' } },
        { url: '/api/leads', method: 'GET' },
        { url: '/api/calls', method: 'GET' }
      ]
      
      // Test each endpoint
      for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint.url, endpoint.method, endpoint.body)
        setResults(prev => [...prev, result])
      }
      
      const duration = simpleLogger.endTimer('api-diagnostics')
      simpleLogger.info('API diagnostics test completed', { duration: `${duration.toFixed(2)}ms` })
    } catch (error) {
      simpleLogger.error('API diagnostics test failed', { 
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setTesting(false)
    }
  }

  // Test custom endpoint
  const testCustomEndpoint = async () => {
    if (!customEndpoint) return
    
    setTesting(true)
    
    try {
      let body = undefined
      if (customBody && (customMethod === 'POST' || customMethod === 'PUT')) {
        body = JSON.parse(customBody)
      }
      
      const result = await testEndpoint(customEndpoint, customMethod, body)
      setResults(prev => [result, ...prev])
    } catch (error) {
      simpleLogger.error('Custom API test failed', { 
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>API Diagnostics</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testAllEndpoints}
          disabled={testing}
        >
          {testing ? 'Testing...' : 'Test All Endpoints'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 border rounded-md">
          <h3 className="text-lg font-medium mb-2">Custom API Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <div>
              <label className="text-sm font-medium">Endpoint</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="/api/your-endpoint"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Method</label>
              <select 
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value as any)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <Button 
                className="mt-6 w-full"
                onClick={testCustomEndpoint}
                disabled={testing || !customEndpoint || (customBody && !customBodyValid)}
              >
                Test Endpoint
              </Button>
            </div>
          </div>
          {(customMethod === 'POST' || customMethod === 'PUT') && (
            <div className="mt-2">
              <label className="text-sm font-medium">Request Body (JSON)</label>
              <textarea 
                className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${!customBodyValid ? 'border-red-500' : ''}`}
                rows={4}
                placeholder='{"key": "value"}'
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
              />
              {!customBodyValid && (
                <p className="text-xs text-red-500 mt-1">Invalid JSON format</p>
              )}
            </div>
          )}
        </div>
        
        <div className="h-[400px] border rounded-md p-4 overflow-auto">
          {results.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No API tests run yet
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, i) => (
                <div key={i} className={`border rounded-md p-3 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-mono text-sm font-bold">{result.method}</span>
                      <span className="font-mono text-sm ml-2">{result.endpoint}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {result.status} | {result.duration.toFixed(2)}ms
                      </span>
                    </div>
                  </div>
                  {result.error ? (
                    <div className="bg-red-100 p-2 rounded text-sm text-red-800 font-mono overflow-x-auto">
                      {result.error}
                    </div>
                  ) : (
                    <pre className="bg-white p-2 rounded text-xs font-mono overflow-x-auto">
                      {JSON.stringify(result.response, null, 2)}
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
