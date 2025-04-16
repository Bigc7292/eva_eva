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
  Mail,
  Building,
  Star,
  User,
  MapPin,
  Calendar,
  Clock,
  Eye
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { formatCrmId } from '@/utils/crm-utils'
import { leadsService } from '@/services/leads'
import { Lead } from '@/services/leads'

const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'crmId',
    header: 'CRM ID',
    cell: ({ row }) => formatCrmId(row.getValue('crmId'))
  },
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
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('email')}</span>
      </div>
    )
  },
  {
    accessorKey: 'propertyInterest',
    header: 'Interest',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('propertyInterest')}</span>
      </div>
    )
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-yellow-400" />
        <span>{row.getValue('rating')}/5</span>
      </div>
    )
  }
]

export default function LeadsPage() {
  const router = useRouter()
  const [data, setData] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const leads = await leadsService.getLeads()
      setData(leads)
    } catch (error) {
      console.error('Error loading leads:', error)
      setData([]) // Set empty array instead of using dummy data
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      loadLeads()
      return
    }
    try {
      setLoading(true)
      const results = await leadsService.searchLeads(query)
      setData(results)
    } catch (error) {
      console.error('Error searching leads:', error)
      setData([]) // Set empty array instead of using dummy data
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = (lead: Lead) => {
    router.push(`/leads/${lead.id}`)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Leads" description="Manage your leads" />
        <Button>Add New Lead</Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search leads..."
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
                const lead = row.original

                return (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation()
                      leadsService.initiateCall(lead.id)
                    }}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/leads/${lead.id}`)
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
          onRowClick={handleCellClick}
        />
      </Card>
    </div>
  )
}
