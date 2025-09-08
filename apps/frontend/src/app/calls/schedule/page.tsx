'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Phone, Calendar, Clock } from 'lucide-react'
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon } from '@/components/ui/icons/custom-icons'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'

export default function ScheduleCallPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [leadId, setLeadId] = useState('')
  const [notes, setNotes] = useState('')
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [loading, setLoading] = useState(false)
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [result, setResult] = useState<{ success: boolean; message: string; schedule?: any } | null>(null)
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [scheduledCalls, setScheduledCalls] = useState<any[]>([])
  const [loadingScheduled, setLoadingScheduled] = useState(false)

  const { toast } = useToast()

  // Generate time options for the select
  const timeOptions = []
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0')
      const formattedMinute = minute.toString().padStart(2, '0')
      timeOptions.push(`${formattedHour}:${formattedMinute}`)
    }
  }

  // Fetch scheduled calls
  const fetchScheduledCalls = async () => {
    setLoadingScheduled(true)
    try {
      const response = await fetch('/api/calls/scheduled')

      if (!response.ok) {
        throw new Error('Failed to fetch scheduled calls')
      }

      const data = await response.json()
      setScheduledCalls(data.scheduledCalls)
    } catch (error) {
      console.error('Error fetching scheduled calls:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch scheduled calls',
        variant: 'destructive'
      })
    } finally {
      setLoadingScheduled(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please enter a phone number to schedule a call',
        variant: 'destructive'
      })
      return
    }

    if (!scheduledDate) {
      toast({
        title: 'Date required',
        description: 'Please select a date for the scheduled call',
        variant: 'destructive'
      })
      return
    }

    // Basic phone number validation
    const phoneRegex = /^\+[0-9]{8,15}$/
    if (!phoneRegex.test(phoneNumber)) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number with country code (e.g., +971501234567)',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Combine date and time
      const [hours, minutes] = scheduledTime.split(':').map(Number)
      const scheduledDateTime = new Date(scheduledDate)
      scheduledDateTime.setHours(hours, minutes, 0, 0)

      const response = await fetch('/api/calls/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          leadId: leadId || undefined,
          scheduledTime: scheduledDateTime.toISOString(),
          metadata: {
            notes,
            source: 'schedule-call-page'
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Call scheduled successfully',
          schedule: data.schedule
        })

        // Refresh the scheduled calls list
        fetchScheduledCalls()

        toast({
          title: 'Call scheduled',
          description: `Call to ${phoneNumber} has been scheduled for ${format(scheduledDateTime, 'PPp')}`,
        })

        // Reset form
        setPhoneNumber('')
        setLeadId('')
        setNotes('')
        setScheduledDate(undefined)
        setScheduledTime('09:00')
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to schedule call'
        })
        toast({
          title: 'Scheduling failed',
          description: data.error || 'Failed to schedule call',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error scheduling call:', error)
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      })
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Cancel a scheduled call
  const handleCancelSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/calls/schedule/${scheduleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel scheduled call')
      }

      toast({
        title: 'Call cancelled',
        description: 'The scheduled call has been cancelled',
      })

      // Refresh the scheduled calls list
      fetchScheduledCalls()
    } catch (error) {
      console.error('Error cancelling scheduled call:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel scheduled call',
        variant: 'destructive'
      })
    }
  }

  // Load scheduled calls on component mount
  useState(() => {
    fetchScheduledCalls()
  })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Schedule a Call</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Call Details</CardTitle>
            <CardDescription>
              Enter the details for the call you want to schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} id="schedule-form">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+971501234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the phone number with country code (e.g., +971 for UAE)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadId">Lead ID (Optional)</Label>
                  <Input
                    id="leadId"
                    placeholder="Enter lead ID if available"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {scheduledDate ? (
                            format(scheduledDate, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">Time *</Label>
                    <Select value={scheduledTime} onValueChange={setScheduledTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this call"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              form="schedule-form"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Scheduling Call...' : 'Schedule Call'}
              {!loading && <Calendar className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Status</CardTitle>
              <CardDescription>
                The status of your scheduled call will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="ml-3">Scheduling call...</span>
                </div>
              )}

              {!loading && !result && (
                <div className="text-center py-8 text-muted-foreground">
                  No call scheduled yet
                </div>
              )}

              {result && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <AlertTriangleIcon className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {result.success ? 'Call Scheduled' : 'Scheduling Failed'}
                  </AlertTitle>
                  <AlertDescription>
                    {result.message}
                  </AlertDescription>
                </Alert>
              )}

              {result?.success && result.schedule && (
                <div className="mt-4 border rounded-md p-4">
                  <h3 className="font-medium mb-2">Schedule Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">Schedule ID:</span>
                      <span className="col-span-2">{result.schedule.id}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">Phone Number:</span>
                      <span className="col-span-2">{result.schedule.phone_number}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">Scheduled Time:</span>
                      <span className="col-span-2">
                        {result.schedule.scheduled_time
                          ? format(new Date(result.schedule.scheduled_time), 'PPp')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Upcoming Scheduled Calls</CardTitle>
                  <CardDescription>
                    View and manage your scheduled calls
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchScheduledCalls}
                  disabled={loadingScheduled}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingScheduled ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="ml-3">Loading scheduled calls...</span>
                </div>
              ) : scheduledCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scheduled calls found
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Scheduled Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledCalls.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{schedule.phone_number}</TableCell>
                          <TableCell>
                            {schedule.scheduled_time
                              ? format(new Date(schedule.scheduled_time), 'PPp')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                              {schedule.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelSchedule(schedule.id)}
                            >
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>How it works:</strong> This page allows you to schedule calls for a future date and time using the VAPI service.
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Enter the phone number with country code</li>
                  <li>Optionally add a lead ID if this call is for an existing lead</li>
                  <li>Select the date and time for the call</li>
                  <li>Add any notes about the call</li>
                  <li>Click "Schedule Call" to schedule the call</li>
                </ol>
                <div className="flex items-center mt-4 p-4 bg-muted rounded-md">
                  <InfoIcon className="h-5 w-5 mr-2 text-blue-500" />
                  <p>
                    Scheduled calls will be automatically initiated at the specified time. You can view and manage your scheduled calls in the "Upcoming Scheduled Calls" section.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
