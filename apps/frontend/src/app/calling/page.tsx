'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'
import { Heading } from '@/components/ui/heading'
import { QuickDial } from '@/components/calls/QuickDial'
import { CsvImport } from '@/components/contacts/CsvImport'
import { CallAnalyticsChart } from '@/components/dashboard/CallAnalyticsChart'
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  User,
  Eye,
  Plus,
  FileUp
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { callsService } from '@/services/calls'
import { databaseService } from '@/services/database'
import { leadsService } from '@/services/leads'
import { Lead, Call } from '@/lib/dummy-data'
import { useToast } from '@/components/ui/use-toast'

const callColumns: ColumnDef<Call>[] = [
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
  }
]

const contactColumns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('name')}</span>
      </div>
    )
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('phone')}</span>
      </div>
    )
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <div>
        {row.getValue('email') || '-'}
      </div>
    )
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => (
      <div>
        {row.getValue('location') || '-'}
      </div>
    )
  },
  {
    accessorKey: 'totalCalls',
    header: 'Total Calls',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <PhoneCall className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('totalCalls')}</span>
      </div>
    )
  },
  {
    accessorKey: 'lastContactDate',
    header: 'Last Contact',
    cell: ({ row }) => {
      const date = row.getValue('lastContactDate') as string
      return date ? (
        <div>
          {new Date(date).toLocaleDateString()}
        </div>
      ) : (
        <div>-</div>
      )
    }
  }
]

export default function CallingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dial')
  const [calls, setCalls] = useState<Call[]>([])
  const [contacts, setContacts] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load calls
      const callsData = await callsService.getCalls()
      setCalls(callsData)

      // Load contacts
      const contactsData = await leadsService.getLeads()
      setContacts(contactsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCallContact = async (lead: Lead) => {
    try {
      // Make the call
      await leadsService.initiateCall(lead.id)

      toast({
        title: 'Call Initiated',
        description: `Calling ${lead.name} at ${lead.phone}`,
        variant: 'default'
      })

      // Refresh data
      loadData()
    } catch (error) {
      console.error('Error making call:', error)
      toast({
        title: 'Error',
        description: 'Failed to initiate call. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleViewCall = (call: Call) => {
    router.push(`/calls/${call.id}`)
  }

  const handleViewContact = (lead: Lead) => {
    router.push(`/leads/${lead.id}`)
  }

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.location && contact.location.toLowerCase().includes(query))
    )
  })

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Calling Center" description="Make calls and manage contacts" />
        <Button onClick={() => setActiveTab('import')}>
          <FileUp className="mr-2 h-4 w-4" />
          Import Contacts
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dial">Quick Dial</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="dial" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <QuickDial />

            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>Your most recent calls</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={callColumns}
                  data={calls.slice(0, 5)}
                  loading={loading}
                  onRowClick={handleViewCall}
                />
              </CardContent>
            </Card>
          </div>

          <CallAnalyticsChart />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>Manage your contacts and make calls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <DataTable
                columns={[
                  ...contactColumns,
                  {
                    id: 'actions',
                    cell: ({ row }) => {
                      const lead = row.original

                      return (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCallContact(lead)
                            }}
                          >
                            <PhoneCall className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewContact(lead)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      )
                    }
                  }
                ]}
                data={filteredContacts}
                loading={loading}
                onRowClick={handleViewContact}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <CsvImport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
