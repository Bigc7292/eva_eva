'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, Mail, MapPin, Calendar, Clock, User, FileText, AudioLines, MessageSquare } from 'lucide-react'

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  status: string
  property_interest: string
  budget: number
  location: string
  nationality: string
  notes: string
  created_at: string
  updated_at: string
}

interface LeadProfile {
  id: string
  lead_id: string
  phone: string
  first_contact_date: string
  successful_meetings: number
  total_calls: number
  answered_calls: number
  missed_calls: number
  last_call_date: string
  last_call_status: string
  callback_date?: string
  interest_level: string
  created_at: string
  updated_at: string
}

interface Call {
  id: string
  call_id: string
  lead_id: string
  phone_number: string
  call_type: string
  call_status: string
  call_outcome?: string
  timestamp: string
  end_time?: string
  call_duration?: number
  recording_url?: string
  transcript?: string
  summary?: string
  meeting_scheduled?: boolean
  meeting_time?: string
  callback_scheduled?: boolean
  callback_time?: string
  created_at: string
  updated_at: string
  metadata?: any
}

interface Meeting {
  id: string
  lead_id: string
  call_id: string
  timestamp: string
  location: string
  property_type: string
  budget: number
  notes: string
  status: string
  created_at: string
  updated_at: string
}

export default function LeadProfilePage() {
  const params = useParams()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [profile, setProfile] = useState<LeadProfile | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeadData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch lead data from enhanced_leads
        const { data: leadData, error: leadError } = await supabase
          .from('enhanced_leads')
          .select('*')
          .eq('lead_id', leadId)
          .single()

        if (leadError) {
          throw new Error(`Error fetching lead: ${leadError.message}`)
        }

        if (!leadData) {
          throw new Error('Lead not found')
        }

        // Convert enhanced_leads data to our Lead interface
        const processedLead: Lead = {
          id: leadData.lead_id,
          name: leadData.name || 'Unknown',
          phone: leadData.phone_number || leadData.phone || '',
          email: leadData.email || '',
          status: leadData.status || 'new',
          property_interest: leadData.property_interest || '',
          budget: leadData.budget || 0,
          location: leadData.location || '',
          nationality: leadData.nationality || '',
          notes: leadData.notes || '',
          created_at: leadData.created_at,
          updated_at: leadData.updated_at
        }

        setLead(processedLead)

        // Create profile data from enhanced_leads
        const profileData: LeadProfile = {
          id: leadData.lead_id,
          lead_id: leadData.lead_id,
          phone: leadData.phone_number || leadData.phone || '',
          first_contact_date: leadData.created_at,
          successful_meetings: leadData.successful_meetings || 0,
          total_calls: leadData.total_calls || 0,
          answered_calls: leadData.answered_calls || 0,
          missed_calls: leadData.missed_calls || 0,
          last_call_date: leadData.last_call_date,
          last_call_status: leadData.last_call_status,
          interest_level: leadData.lead_quality || 'Unknown',
          created_at: leadData.created_at,
          updated_at: leadData.updated_at
        }

        setProfile(profileData)

        // Fetch calls for this lead
        // Since the calls table doesn't have a direct lead_id column, we'll fetch all calls
        // and filter them in the frontend for now
        const { data: callsData, error: callsError } = await supabase
          .from('calls')
          .select('*')
          .order('start_time', { ascending: false })

        if (callsError) {
          console.error('Error fetching calls:', callsError)
        }

        // Get the lead's phone number
        const leadPhoneNumber = leadData.phone_number || leadData.phone

        // Filter calls by phone number to match the lead
        const filteredCalls = callsData?.filter(call => call.phone_number === leadPhoneNumber) || []

        // Process calls data
        const processedCalls = filteredCalls.map(call => ({
          id: call.call_id,
          call_id: call.call_id,
          lead_id: leadId,
          phone_number: call.phone_number,
          call_type: call.call_type || 'Unknown',
          call_status: call.call_status || 'Unknown',
          call_outcome: call.call_outcome,
          timestamp: call.start_time,
          end_time: call.end_time,
          call_duration: call.call_duration,
          recording_url: call.recording_url,
          transcript: call.transcript,
          summary: call.summary,
          meeting_scheduled: call.meeting_scheduled || false,
          meeting_time: call.meeting_time,
          callback_scheduled: call.callback_scheduled || false,
          callback_time: call.callback_time,
          created_at: call.created_at,
          updated_at: call.updated_at,
          metadata: null
        })) || []

        setCalls(processedCalls)

        // For now, we'll set meetings to an empty array
        setMeetings([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        console.error('Error fetching lead data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (leadId) {
      fetchLeadData()
    }
  }, [leadId])

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The lead you are looking for does not exist or has been removed.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'default'
      case 'interested':
        return 'secondary'
      case 'booked':
        return 'success'
      case 'call_back_later':
        return 'warning'
      case 'not_interested':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getInterestLevelBadgeVariant = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'success'
      case 'medium':
        return 'warning'
      case 'low':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name)}&background=random`} />
            <AvatarFallback>{lead.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Badge variant={getStatusBadgeVariant(lead.status)}>
                {lead.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {profile?.interest_level && (
                <Badge variant={getInterestLevelBadgeVariant(profile.interest_level)}>
                  {profile.interest_level} Interest
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Phone className="mr-2 h-4 w-4" />
            Call Now
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Call
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Message
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{lead.phone || 'No phone number'}</span>
            </div>
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{lead.email || 'No email'}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{lead.location || 'No location'}</span>
            </div>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{lead.nationality || 'No nationality'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Property Interest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{lead.property_interest || 'Not specified'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Budget:</span>
              <span>{lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span>{lead.location || 'Not specified'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Call Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Calls:</span>
              <span>{profile?.total_calls || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Answered:</span>
              <span>{profile?.answered_calls || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Missed:</span>
              <span>{profile?.missed_calls || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Contact:</span>
              <span>{profile?.last_call_date ? formatDate(profile.last_call_date) : 'Never'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{lead.notes || 'No notes available'}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="calls">
        <TabsList>
          <TabsTrigger value="calls">Call History</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>
        <TabsContent value="calls" className="space-y-4">
          {calls.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No call history available
              </CardContent>
            </Card>
          ) : (
            calls.map((call) => (
              <Card key={call.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{call.call_type} Call</CardTitle>
                      <Badge variant="outline">{call.call_status}</Badge>
                      {call.call_outcome && <Badge>{call.call_outcome}</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(call.timestamp)}</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-2 space-y-2">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{formatDuration(call.call_duration)}</span>
                    </div>
                    {call.meeting_scheduled && (
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span>Meeting: {call.meeting_time ? formatDate(call.meeting_time) : 'Scheduled'}</span>
                      </div>
                    )}
                    {call.callback_scheduled && (
                      <div className="flex items-center">
                        <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span>Callback: {call.callback_time ? formatDate(call.callback_time) : 'Scheduled'}</span>
                      </div>
                    )}
                  </div>
                  {call.summary && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center mb-1">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Summary</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{call.summary}</p>
                    </div>
                  )}
                </CardContent>
                {call.recording_url && (
                  <CardFooter className="flex justify-between border-t pt-4 pb-2">
                    <div className="flex items-center">
                      <AudioLines className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Recording</span>
                    </div>
                    <audio controls className="w-2/3 h-8">
                      <source src={call.recording_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="meetings" className="space-y-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No meetings scheduled
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">Meeting</CardTitle>
                      <Badge variant={meeting.status === 'completed' ? 'success' : meeting.status === 'cancelled' ? 'destructive' : 'outline'}>
                        {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(meeting.timestamp)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{meeting.location || 'No location'}</span>
                    </div>
                    {meeting.property_type && (
                      <div className="flex items-center">
                        <span>Property Type: {meeting.property_type}</span>
                      </div>
                    )}
                  </div>
                  {meeting.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
