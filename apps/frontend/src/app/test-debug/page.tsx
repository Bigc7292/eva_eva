'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  
  useEffect(() => {
    // Add initial log
    addLog('Test debug page loaded')
    
    // Log React version
    try {
      const reactModule = require('react')
      addLog(`React version: ${reactModule.version}`)
    } catch (error) {
      addLog(`Error getting React version: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // Test useReducer
    try {
      const React = require('react')
      const [state, dispatch] = React.useReducer((state: number, action: string) => {
        if (action === 'increment') return state + 1
        return state
      }, 0)
      
      addLog(`useReducer test passed: ${state}`)
      dispatch('increment')
    } catch (error) {
      addLog(`useReducer test failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // Log environment
    addLog(`NODE_ENV: ${process.env.NODE_ENV}`)
  }, [])
  
  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, message])
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Test Debug Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            {logs.length === 0 ? (
              <p>No logs yet...</p>
            ) : (
              <pre className="whitespace-pre-wrap">
                {logs.map((log, index) => (
                  <div key={index} className="py-1 border-b last:border-0">
                    {log}
                  </div>
                ))}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
