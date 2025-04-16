'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Calendar, Clock, User, FileText, FileAudio, Search, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Call {
  id: string;
  call_id: string;
  phone_number: string;
  call_type: string;
  call_status: string;
  start_time: string;
  end_time?: string;
  call_duration?: number;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export default function CallsPage() {
  const router = useRouter()
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([])

  const fetchCalls = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/calls')

      if (!response.ok) {
        throw new Error('Failed to fetch calls')
      }

      const data = await response.json()
      setCalls(data)
      setFilteredCalls(data)
    } catch (err) {
      console.error('Error fetching calls:', err)
      setError('Failed to load calls. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalls()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCalls(calls)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = calls.filter(call =>
      call.phone_number.toLowerCase().includes(query) ||
      call.call_id.toLowerCase().includes(query) ||
      call.call_status.toLowerCase().includes(query) ||
      call.call_type.toLowerCase().includes(query)
    )

    setFilteredCalls(filtered)
  }, [searchQuery, calls])

  const handleRowClick = (call: Call) => {
    router.push(`/calls/${call.call_id}`)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500'
      case 'started':
      case 'in progress':
        return 'bg-blue-500'
      case 'meeting booked':
        return 'bg-purple-500'
      case 'failed':
      case 'error':
        return 'bg-red-500'
      case 'missed':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Call History</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchCalls}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/calls/single">
              <Phone className="h-4 w-4 mr-2" />
              New Call
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search calls by phone number, status, or ID..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : calls.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                calls.filter(call =>
                  call.call_status.toLowerCase() === 'completed'
                ).length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                calls.filter(call =>
                  call.call_status.toLowerCase() === 'meeting booked'
                ).length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Phone Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Artifacts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-8 w-20" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    {error}
                    <Button variant="link" onClick={fetchCalls} className="ml-2">
                      Try again
                    </Button>
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    {searchQuery ? 'No calls match your search' : 'No calls found'}
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-muted/50" onClick={() => handleRowClick(call)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(call.call_status)}`} />
                        <span>{call.call_status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{call.phone_number}</td>
                    <td className="px-4 py-3">
                      <Badge variant={call.call_type === 'Inbound' ? 'default' : 'secondary'}>
                        {call.call_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span title={format(new Date(call.start_time), 'PPpp')}>
                          {formatDistanceToNow(new Date(call.start_time), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {formatDuration(call.call_duration)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {call.transcript ? (
                          <div className="text-blue-500" title="Transcript available">
                            <FileText className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="text-muted-foreground" title="No transcript">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}

                        {call.recording_url ? (
                          <div className="text-blue-500" title="Recording available">
                            <FileAudio className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="text-muted-foreground" title="No recording">
                            <FileAudio className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/calls/${call.call_id}`}>
                          View Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
