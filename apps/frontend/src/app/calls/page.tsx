'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Phone, Calendar, Clock, User } from 'lucide-react'
import { callsService } from '@/services/calls'
import type { Call, CallAnalytics } from '@/types/call'

export default function CallsPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const data = await callsService.getCallAnalytics()
        setAnalytics(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query) {
      callsService.getCallAnalytics().then(data => {
        setAnalytics(data)
      }).catch(error => {
        setError(error instanceof Error ? error.message : 'Failed to fetch analytics')
      })
      return
    }

    const filteredCalls = analytics?.calls.filter((call: Call) =>
      call.customer_phone.includes(query) ||
      (call.agent_name?.toLowerCase().includes(query.toLowerCase()) || false)
    ) || []

    setAnalytics(prev => prev ? { ...prev, calls: filteredCalls } : null)
  }

  const handleRowClick = (call: Call) => {
    router.push(`/calls/${call.id}`)
  }

  const formatDuration = (duration?: number): string => {
    if (!duration) return 'N/A'
    const minutes = Math.floor(duration / 60)
    const seconds = (duration % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Card>
          <div className="animate-pulse">
            {/* biome-ignore lint/style/useSelfClosingElements: <explanation> */}
            <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-64 mb-4" />
            <div className="h-4 bg-gray-300 rounded w-48" />
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Card>
          <div className="text-red-500">{error}</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4">Calls</h3>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Customer Phone</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics?.calls.map((call: Call) => (
              <TableRow key={call.id} onClick={() => handleRowClick(call)}>
                <TableCell>{call.call_id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {call.status === 'completed' && <Phone className="h-4 w-4 text-green-500" />}
                    {call.status === 'missed' && <Phone className="h-4 w-4 text-red-500" />}
                    {call.status === 'voicemail' && <Phone className="h-4 w-4 text-yellow-500" />}
                    <span>{call.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(call.start_time)}</span>
                  </div>
                </TableCell>
                <TableCell>{call.customer_phone}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(call.call_duration)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {call.agent_name && <User className="h-4 w-4 text-muted-foreground" />}
                    <span>{call.agent_name || 'N/A'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium">Total Calls</h3>
          <p className="text-2xl font-bold">{analytics?.totalCalls || 0}</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium">Successful</h3>
          <p className="text-2xl font-bold">{analytics?.successfulCalls || 0}</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium">Missed</h3>
          <p className="text-2xl font-bold">{analytics?.missedCalls || 0}</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium">Average Duration</h3>
          <p className="text-2xl font-bold">
            {analytics?.averageCallDuration ? 
              `${Math.floor(analytics.averageCallDuration / 60)}m ${(analytics.averageCallDuration % 60).toFixed(0)}s` 
              : 'N/A'}
          </p>
        </Card>
      </div>
    </div>
  )
}
