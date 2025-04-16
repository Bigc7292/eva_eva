'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Phone,
  ArrowDownUp,
  ArrowUpDown,
  FileText,
  Headphones,
  Calendar,
  Clock,
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { LoaderIcon } from '@/components/ui/icons/custom-icons'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

interface Call {
  id: string;
  call_id: string;
  phone_number: string;
  call_type: string;
  call_status: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  transcript?: string;
  recording_url?: string;
  metadata?: Record<string, any>;
  lead_id?: string;
}

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCalls, setTotalCalls] = useState(0)
  const [sortField, setSortField] = useState('start_time')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  const pageSize = 10

  // Fetch calls from the API
  const fetchCalls = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/calls/history?page=${page}&pageSize=${pageSize}&sort=${sortField}&order=${sortDirection}&search=${searchQuery}&status=${statusFilter}&type=${typeFilter}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch calls')
      }

      const data = await response.json()
      setCalls(data.calls)
      setTotalPages(data.totalPages)
      setTotalCalls(data.totalCalls)
    } catch (error) {
      console.error('Error fetching calls:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch call history',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch call details
  const fetchCallDetails = async (callId: string) => {
    try {
      const response = await fetch(`/api/calls/status/${callId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch call details')
      }

      const data = await response.json()
      return data.call
    } catch (error) {
      console.error('Error fetching call details:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch call details',
        variant: 'destructive'
      })
      return null
    }
  }

  // Handle call selection
  const handleSelectCall = async (call: Call) => {
    setSelectedCall(call)

    // If the call has a VAPI call ID, fetch the latest details
    if (call.call_id) {
      const updatedCall = await fetchCallDetails(call.call_id)
      if (updatedCall) {
        setSelectedCall({
          ...call,
          transcript: updatedCall.transcript,
          recording_url: updatedCall.recording_url,
          call_status: updatedCall.status || call.call_status,
          duration: updatedCall.duration || call.duration
        })
      }
    }
  }

  // Handle sort change
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Export calls to CSV
  const exportToCsv = () => {
    // Create CSV content
    const headers = ['Call ID', 'Phone Number', 'Type', 'Status', 'Start Time', 'End Time', 'Duration']
    const csvContent = [
      headers.join(','),
      ...calls.map(call => [
        call.call_id,
        call.phone_number,
        call.call_type,
        call.call_status,
        call.start_time,
        call.end_time || '',
        call.duration || ''
      ].join(','))
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `call_history_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Export Complete',
      description: 'Call history has been exported to CSV',
    })
  }

  // Format duration in seconds to minutes:seconds
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">Completed</Badge>
      case 'in-progress':
      case 'in progress':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">In Progress</Badge>
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300">Failed</Badge>
      case 'initiated':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">Initiated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Effect to fetch calls when dependencies change
  useEffect(() => {
    fetchCalls()
  }, [page, sortField, sortDirection, searchQuery, statusFilter, typeFilter])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Call History</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Calls</CardTitle>
                  <CardDescription>
                    View and manage your call history
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCalls}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCsv}
                    disabled={calls.length === 0 || loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search phone numbers..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="initiated">Initiated</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[130px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="inbound">Inbound</SelectItem>
                        <SelectItem value="outbound">Outbound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Table */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <div
                            className="flex items-center cursor-pointer"
                            onClick={() => handleSort('call_type')}
                          >
                            Type
                            {sortField === 'call_type' && (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>
                          <div
                            className="flex items-center cursor-pointer"
                            onClick={() => handleSort('phone_number')}
                          >
                            Phone Number
                            {sortField === 'phone_number' && (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>
                          <div
                            className="flex items-center cursor-pointer"
                            onClick={() => handleSort('call_status')}
                          >
                            Status
                            {sortField === 'call_status' && (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>
                          <div
                            className="flex items-center cursor-pointer"
                            onClick={() => handleSort('start_time')}
                          >
                            Date & Time
                            {sortField === 'start_time' && (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">
                          <div
                            className="flex items-center justify-end cursor-pointer"
                            onClick={() => handleSort('duration')}
                          >
                            Duration
                            {sortField === 'duration' && (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex justify-center">
                              <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              Loading call history...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : calls.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="text-muted-foreground">
                              No calls found
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        calls.map((call) => (
                          <TableRow
                            key={call.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSelectCall(call)}
                          >
                            <TableCell>
                              <div className="flex items-center">
                                {call.call_type.toLowerCase() === 'inbound' ? (
                                  <ArrowDownUp className="h-4 w-4 mr-2 text-green-600" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 mr-2 text-blue-600" />
                                )}
                                {call.call_type}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{call.phone_number}</div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(call.call_status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {call.start_time ? format(new Date(call.start_time), 'MMM d, yyyy') : 'N/A'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {call.start_time ? format(new Date(call.start_time), 'h:mm a') : ''}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatDuration(call.duration)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {calls.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCalls)} of {totalCalls} calls
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages || loading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Call Details</CardTitle>
              <CardDescription>
                Select a call to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCall ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{selectedCall.phone_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Call ID: {selectedCall.call_id}
                      </p>
                    </div>
                    {getStatusBadge(selectedCall.call_status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Date
                      </div>
                      <div>
                        {selectedCall.start_time
                          ? format(new Date(selectedCall.start_time), 'MMM d, yyyy')
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Time
                      </div>
                      <div>
                        {selectedCall.start_time
                          ? format(new Date(selectedCall.start_time), 'h:mm a')
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Type
                      </div>
                      <div>{selectedCall.call_type}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Duration
                      </div>
                      <div>{formatDuration(selectedCall.duration)}</div>
                    </div>
                  </div>

                  <Tabs defaultValue="transcript">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="transcript" disabled={!selectedCall.transcript}>
                        <FileText className="h-4 w-4 mr-2" />
                        Transcript
                      </TabsTrigger>
                      <TabsTrigger value="recording" disabled={!selectedCall.recording_url}>
                        <Headphones className="h-4 w-4 mr-2" />
                        Recording
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="transcript" className="mt-4">
                      {selectedCall.transcript ? (
                        <div className="bg-muted p-4 rounded-md max-h-[300px] overflow-y-auto">
                          <pre className="text-sm whitespace-pre-wrap">{selectedCall.transcript}</pre>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No transcript available
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="recording" className="mt-4">
                      {selectedCall.recording_url ? (
                        <div className="space-y-2">
                          <audio controls className="w-full">
                            <source src={selectedCall.recording_url} type="audio/mpeg" />
                            <track kind="captions" src="" label="English captions" />
                            Your browser does not support the audio element.
                          </audio>
                          <div className="text-sm">
                            <a
                              href={selectedCall.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download recording
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No recording available
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {selectedCall.metadata && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Metadata</h4>
                      <div className="bg-muted p-4 rounded-md max-h-[150px] overflow-y-auto">
                        <pre className="text-xs">{JSON.stringify(selectedCall.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Select a call to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
