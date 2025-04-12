'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { Heading } from '@/components/ui/heading'
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  User,
  Eye
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { callsService } from '@/services/calls'
import { dummyCallAnalytics } from '@/lib/dummy-data'

// Import Call interface from dummy-data.ts
import { Call } from '@/lib/dummy-data'

const columns: ColumnDef<Call>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Date & Time',
    cell: ({ row }) => {
      const timestamp = new Date(row.getValue('timestamp'))
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'leadName',
    header: 'Contact',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('leadName')}</span>
      </div>
    )
  },
  {
    accessorKey: 'leadPhone',
    header: 'Phone',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('leadPhone')}</span>
      </div>
    )
  },
  {
    accessorKey: 'callType',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('callType') as string
      return (
        <div className="flex items-center gap-2">
          {type === 'Inbound' ?
            <PhoneIncoming className="h-4 w-4 text-green-500" /> :
            <PhoneOutgoing className="h-4 w-4 text-blue-500" />
          }
          <span>{type}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'callStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('callStatus') as string
      let statusColor = 'text-gray-500'
      if (status === 'Completed') statusColor = 'text-green-500'
      if (status === 'Missed') statusColor = 'text-red-500'
      if (status === 'Voicemail') statusColor = 'text-yellow-500'

      return (
        <div className={`font-medium ${statusColor}`}>
          {status}
        </div>
      )
    }
  },
  {
    accessorKey: 'callDuration',
    header: 'Duration',
    cell: ({ row }) => {
      const duration = row.getValue('callDuration') as number
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60

      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{minutes}m {seconds}s</span>
        </div>
      )
    }
  },
  // Actions column is added dynamically in the DataTable component
]

export default function CallsPage() {
  const router = useRouter()
  const [data, setData] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCalls()
  }, [])

  const loadCalls = async () => {
    try {
      setLoading(true)
      try {
        const calls = await callsService.getCalls()
        setData(calls)
      } catch (apiError) {
        console.error('Error from API, using dummy data:', apiError)
        // Use dummy data if API fails
        setData(dummyCallAnalytics.callsByDay.map((day, index) => ({
          id: `call-${index + 1}`,
          retellCallId: `retell-${Math.floor(Math.random() * 1000000)}`,
          timestamp: day.date,
          callDuration: Math.floor(Math.random() * 300) + 60,
          callType: index % 2 === 0 ? 'Inbound' : 'Outbound',
          callStatus: index % 3 === 0 ? 'Missed' : 'Completed',
          audioUrl: `https://example.com/recordings/call-${index + 1}.mp3`,
          detailedCallSummary: `Call summary for call ${index + 1}`,
          leadId: `lead-${index + 1}`,
          leadName: `Client ${index + 1}`,
          leadEmail: `client${index + 1}@example.com`,
          leadPhone: `+971 5${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        })))
      }
    } catch (error) {
      console.error('Error loading calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      loadCalls()
      return
    }

    // Filter calls based on search query
    const filteredCalls = data.filter(call =>
      call.leadName.toLowerCase().includes(query.toLowerCase()) ||
      call.leadPhone.includes(query) ||
      call.leadEmail.toLowerCase().includes(query.toLowerCase())
    )

    setData(filteredCalls)
  }

  const handleRowClick = (call: Call) => {
    router.push(`/calls/${call.id}`)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Calls" description="Manage and analyze your calls" />
        <Button>
          <PhoneOutgoing className="mr-2 h-4 w-4" />
          New Call
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search calls..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <DataTable
          columns={[
            ...columns,
            {
              id: 'actions',
              cell: ({ row }) => {
                const call = row.original

                return (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/calls/${call.id}`)
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                )
              }
            }
          ]}
          data={data}
          loading={loading}
          onRowClick={handleRowClick}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium">Total Calls</h3>
          <p className="text-2xl font-bold">{dummyCallAnalytics.totalCalls}</p>
          <p className="text-xs text-muted-foreground">
            {dummyCallAnalytics.completedCalls} completed, {dummyCallAnalytics.missedCalls} missed
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium">Inbound Calls</h3>
          <p className="text-2xl font-bold">{dummyCallAnalytics.inboundCalls}</p>
          <p className="text-xs text-muted-foreground">
            {((dummyCallAnalytics.inboundCalls / dummyCallAnalytics.totalCalls) * 100).toFixed(1)}% of total
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium">Outbound Calls</h3>
          <p className="text-2xl font-bold">{dummyCallAnalytics.outboundCalls}</p>
          <p className="text-xs text-muted-foreground">
            {((dummyCallAnalytics.outboundCalls / dummyCallAnalytics.totalCalls) * 100).toFixed(1)}% of total
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium">Avg Call Duration</h3>
          <p className="text-2xl font-bold">
            {Math.floor(dummyCallAnalytics.averageCallDuration / 60)}m {dummyCallAnalytics.averageCallDuration % 60}s
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Call Types</h3>
          <div className="grid grid-cols-2 gap-4">
            {dummyCallAnalytics.callsByType.map((type: any, index: number) => (
              <div key={index} className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium">{type.type}</h4>
                <p className="text-2xl font-bold">{type.count}</p>
                <p className="text-xs text-muted-foreground">
                  {((type.count / dummyCallAnalytics.totalCalls) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Call Status</h3>
          <div className="grid grid-cols-3 gap-4">
            {dummyCallAnalytics.callsByStatus.map((status: any, index: number) => (
              <div key={index} className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium">{status.status}</h4>
                <p className="text-2xl font-bold">{status.count}</p>
                <p className="text-xs text-muted-foreground">
                  {((status.count / dummyCallAnalytics.totalCalls) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
