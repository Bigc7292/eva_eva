'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { appLogger } from './AppLogger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our logging system
    appLogger.error('Error caught by ErrorBoundary', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
    
    this.setState({
      errorInfo
    })
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p className="font-medium">Error:</p>
              <p className="text-red-600">{this.state.error?.message || 'Unknown error'}</p>
            </div>
            
            {this.state.error?.stack && (
              <div className="text-xs">
                <p className="font-medium">Stack trace:</p>
                <pre className="mt-2 max-h-[300px] overflow-auto rounded bg-red-100 p-2 dark:bg-red-950/50">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
            
            {this.state.errorInfo?.componentStack && (
              <div className="text-xs">
                <p className="font-medium">Component stack:</p>
                <pre className="mt-2 max-h-[300px] overflow-auto rounded bg-red-100 p-2 dark:bg-red-950/50">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={this.handleReset}>Try Again</Button>
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
