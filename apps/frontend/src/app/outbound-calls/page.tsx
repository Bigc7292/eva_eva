'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Heading } from '@/components/ui/heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUp, Download, Phone } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { CsvImport } from '@/components/contacts/CsvImport'

export default function OutboundCallsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSingleCall = async () => {
    if (!name || !phone) {
      toast({
        title: 'Error',
        description: 'Name and phone number are required',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          callType: 'outbound',
          metadata: {
            source: 'manual_outbound',
            timestamp: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to initiate call')
      }

      toast({
        title: 'Success',
        description: `Initiating call to ${name}`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error initiating call:', error)
      toast({
        title: 'Error',
        description: 'Failed to initiate call. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'Name,Email,Phone Number\nJohn Doe,john@example.com,+971501234567'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'outbound-calls-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="Outbound Calls" description="Make single or bulk outbound calls" />
      </div>

      <Tabs defaultValue="single">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Call</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Calls</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Make Single Call</CardTitle>
              <CardDescription>Enter contact details to make an outbound call</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter contact name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSingleCall}
                disabled={isLoading || !name || !phone}
              >
                <Phone className="mr-2 h-4 w-4" />
                {isLoading ? 'Initiating Call...' : 'Make Call'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Calls Import</CardTitle>
              <CardDescription>Import contacts from CSV for bulk calling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
              <CsvImport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}