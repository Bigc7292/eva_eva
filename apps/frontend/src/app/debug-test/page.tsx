'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimpleLogger, simpleLogger } from '@/components/debug/SimpleLogger'

export default function DebugTestPage() {
  const [reactVersion, setReactVersion] = useState<string>('')
  const [nextVersion, setNextVersion] = useState<string>('')
  
  useEffect(() => {
    // Log page load
    simpleLogger.info('Debug test page loaded')
    
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
    
    // Test useReducer
    try {
      const React = require('react')
      const [state, dispatch] = React.useReducer((state: number, action: string) => {
        if (action === 'increment') return state + 1
        return state
      }, 0)
      
      simpleLogger.info('useReducer test passed', { state })
      dispatch('increment')
    } catch (error) {
      simpleLogger.error('useReducer test failed', { error: String(error) })
    }
  }, [])
  
  const logTestInfo = () => {
    simpleLogger.info('Info log test', { timestamp: new Date().toISOString() })
  }
  
  const logTestWarning = () => {
    simpleLogger.warn('Warning log test', { timestamp: new Date().toISOString() })
  }
  
  const logTestError = () => {
    simpleLogger.error('Error log test', { timestamp: new Date().toISOString() })
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p><strong>React Version:</strong> {reactVersion || 'Unknown'}</p>
              <p><strong>Next.js Version:</strong> {nextVersion || 'Unknown'}</p>
              <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={logTestInfo} variant="outline">Log Info</Button>
              <Button onClick={logTestWarning} variant="outline">Log Warning</Button>
              <Button onClick={logTestError} variant="outline">Log Error</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <SimpleLogger />
    </div>
  )
}
