'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, PhoneOff, Clock, User, Calendar, RefreshCw } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface Call {
  id: string
  call_id: string
  contact_id?: string
  phone_number: string
  call_type: string
  call_status: string
  timestamp: string
  duration?: number
  recording_url?: string
  transcript?: string
  summary?: string
}

interface ActiveCall {
  id: string
  call_id: string
  phone_number: string
  status: string
  startTime: string
  duration: number
  transcript?: string[]
}

export function RealTimeCallMonitoring() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
  const [recentCalls, setRecentCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Function to fetch active calls
  const fetchActiveCalls = async () => {
    try {
      const response = await fetch('/api/calls/active')
      if (!response.ok) {
        throw new Error('Failed to fetch active calls')
      }
      const data = await response.json()
      setActiveCalls(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching active calls:', err)
      setError('Failed to fetch active calls')
    }
  }

  // Function to fetch recent calls
  const fetchRecentCalls = async () => {
    try {
      const response = await fetch('/api/calls/recent')
      if (!response.ok) {
        throw new Error('Failed to fetch recent calls')
      }
      const data = await response.json()
      setRecentCalls(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching recent calls:', err)
      setError('Failed to fetch recent calls')
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh data
  const refreshData = () => {
    setLoading(true)
    fetchActiveCalls()
    fetchRecentCalls()
  }

  // Set up polling for active calls
  useEffect(() => {
    // Initial fetch
    fetchActiveCalls()
    fetchRecentCalls()

    // Set up polling interval (every 5 seconds)
    const interval = setInterval(() => {
      fetchActiveCalls()
      fetchRecentCalls()
    }, 5000)

    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [])

  // Function to get badge variant based on call status
  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('progress') || statusLower.includes('active')) {
      return 'default'
    } else if (statusLower.includes('ringing')) {
      return 'secondary'
    } else if (statusLower.includes('completed') || statusLower.includes('answered')) {
      return 'success'
    } else if (statusLower.includes('missed') || statusLower.includes('no answer')) {
      return 'destructive'
    } else if (statusLower.includes('failed')) {
      return 'destructive'
    } else {
      return 'outline'
    }
  }

  // Function to format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Real-time Call Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Active Calls</h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-center">Loading active calls...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-destructive text-center">{error}</p>
            </div>
          ) : activeCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Phone className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center mb-2">
                No active calls at the moment.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Start a call to see real-time metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCalls.map((call) => (
                <div key={call.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{call.phone_number}</div>
                      <div className="text-sm text-muted-foreground">
                        Started {formatDistanceToNow(new Date(call.startTime), { addSuffix: true })}
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(call.status)}>
                      {call.status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>Duration: {formatDuration(call.duration)}</span>
                  </div>
                  {call.transcript && call.transcript.length > 0 && (
                    <div className="mt-2 text-sm">
                      <div className="font-medium mb-1">Live Transcript:</div>
                      <div className="bg-muted p-2 rounded-md max-h-24 overflow-y-auto">
                        {call.transcript.map((line, index) => (
                          <p key={index} className="mb-1">{line}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Calls</h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-center">Loading recent calls...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-destructive text-center">{error}</p>
            </div>
          ) : recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <PhoneOff className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center mb-2">
                No recent calls found.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Recent calls will appear here when available.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{call.phone_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(call.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusBadgeVariant(call.call_status)}>
                      {call.call_status}
                    </Badge>
                    {call.duration && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDuration(call.duration)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
