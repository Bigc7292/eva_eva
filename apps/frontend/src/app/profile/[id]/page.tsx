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
import { Phone, Mail, MapPin, Calendar, Clock, User /*, FileText as FileIcon, Headphones as HeadphonesIcon, ChatBubble as MessageSquareIcon, Download as DownloadIcon, ArrowDown as ChevronDownIcon, ArrowUp as ChevronUpIcon, Brain as BrainCircuit */ } from 'lucide-react'

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
  metadata?: Record<string, unknown>
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
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeadData() {
      try {
        setLoading(true)
        setError(null)

        // Try to fetch lead data from contacts table first
        let leadData: Record<string, unknown> = {};
        let leadError: Error | null = null;

        try {
          // First try with contact_id field
          const contactResult = await supabase
            .from('contacts')
            .select('*')
            .eq('contact_id', leadId)
            .single();

          leadData = contactResult.data;
          leadError = contactResult.error;

          // If not found, try with id field
          if (leadError) {
            const contactResult2 = await supabase
              .from('contacts')
              .select('*')
              .eq('id', leadId)
              .single();

            leadData = contactResult2.data;
            leadError = contactResult2.error;
          }
        } catch (contactError: unknown) {
          console.log(`Contact not found with ID ${leadId}, trying leads table`);
          leadError = contactError as Error;
        }

        // If contact not found, try leads table
        if (leadError) {
          try {
            const leadResult = await supabase
              .from('leads')
              .select('*')
              .eq('id', leadId)
              .single();

            leadData = leadResult.data;
            leadError = leadResult.error;

            if (leadError) {
              throw new Error(`Error fetching lead: ${leadError.message}`);
            }
          } catch (error) {
            console.error('Error fetching from leads table:', error);
            throw new Error(`Lead not found with ID: ${leadId}`);
          }
        }

        if (!leadData) {
          throw new Error('Lead not found');
        }

        // Convert contact/lead data to our Lead interface
        const processedLead: Lead = {
          id: String(leadData.id || leadData.contact_id || ''),
          name: String(leadData.name || 'Unknown'),
          phone: String(leadData.phone || leadData.phone_number || ''),
          email: String(leadData.email || ''),
          status: String(leadData.status || 'new'),
          property_interest: String(leadData.property_interest || leadData.interests || ''),
          budget: Number(leadData.budget || 0),
          location: String(leadData.location || ''),
          nationality: String(leadData.nationality || ''),
          notes: String(leadData.notes || ''),
          created_at: String(leadData.created_at || new Date().toISOString()),
          updated_at: String(leadData.updated_at || new Date().toISOString())
        }

        setLead(processedLead)

        // Fetch calls for this contact/lead to calculate profile metrics
        let callsData = [];
        let callsError = null;

        // Get the contact ID from either id or contact_id field
        const contactId = leadData.id || leadData.contact_id;
        console.log(`Fetching calls for contact ID: ${contactId}`);

        // Try with contact_id field first
        try {
          const contactIdResult = await supabase
            .from('calls')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false });

          callsData = contactIdResult.data || [];
          callsError = contactIdResult.error;

          console.log(`Found ${callsData.length} calls with contact_id=${contactId}`);

          // If no calls found, try with lead_id field
          if (callsError || callsData.length === 0) {
            const leadIdResult = await supabase
              .from('calls')
              .select('*')
              .eq('lead_id', contactId)
              .order('created_at', { ascending: false });

            callsData = leadIdResult.data || [];
            callsError = leadIdResult.error;

            console.log(`Found ${callsData.length} calls with lead_id=${contactId}`);
          }
        } catch (error) {
          console.error('Error fetching calls:', error);
          callsError = error;
        }

        // Calculate call statistics
        const totalCalls = callsData?.length || 0;
        const answeredCalls = callsData?.filter(call => {
          const status = String(call.status || call.call_status || '').toLowerCase();
          return status === 'completed' || status === 'answered';
        }).length || 0;

        const missedCalls = callsData?.filter(call => {
          const status = String(call.status || call.call_status || '').toLowerCase();
          return status === 'missed' || status === 'no answer' || status === 'failed';
        }).length || 0;

        // Get last call date and status
        let lastCallDate = null;
        let lastCallStatus = null;

        if (callsData && callsData.length > 0) {
          lastCallDate = callsData[0].created_at || callsData[0].timestamp;
          lastCallStatus = callsData[0].status || callsData[0].call_status;
        }

        // Create profile data from contact/lead and calculated metrics
        const profileData: LeadProfile = {
          id: String(leadData.id || ''),
          lead_id: String(leadData.id || ''),
          phone: String(leadData.phone || ''),
          first_contact_date: String(leadData.created_at || new Date().toISOString()),
          successful_meetings: 0, // Will be calculated from meetings table if available
          total_calls: totalCalls,
          answered_calls: answeredCalls,
          missed_calls: missedCalls,
          last_call_date: lastCallDate || '',
          last_call_status: lastCallStatus || '',
          interest_level: String(leadData.interest_level || 'Unknown'),
          created_at: String(leadData.created_at || new Date().toISOString()),
          updated_at: String(leadData.updated_at || new Date().toISOString())
        }

        setProfile(profileData)

        // We already fetched calls above, so we can use that data
        // Process calls data
        const processedCalls = callsData?.map(call => ({
          id: call.id || call.call_id || '',
          call_id: call.call_id || call.id || '',
          lead_id: leadId,
          phone_number: call.phone_number || call.phone || '',
          call_type: call.call_type || call.type || 'Unknown',
          call_status: call.call_status || call.status || 'Unknown',
          call_outcome: call.call_outcome || call.outcome || null,
          timestamp: call.start_time || call.timestamp || call.created_at || '',
          end_time: call.end_time || '',
          call_duration: call.call_duration || call.duration || 0,
          recording_url: call.recording_url || call.audio_url || '',
          transcript: call.transcript || '',
          summary: call.summary || '',
          meeting_scheduled: call.meeting_scheduled || false,
          meeting_time: call.meeting_time || '',
          callback_scheduled: call.callback_scheduled || false,
          callback_time: call.callback_time || '',
          created_at: call.created_at || '',
          updated_at: call.updated_at || '',
          metadata: call.metadata || null
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
              <Badge variant={getStatusBadgeVariant(lead.status) as "default" | "secondary" | "success" | "destructive" | "outline"}>
                {lead.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {profile?.interest_level && (
                <Badge variant={getInterestLevelBadgeVariant(profile.interest_level) as "default" | "secondary" | "success" | "destructive" | "outline"}>
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
            {/* <MessageSquareIcon className="mr-2 h-4 w-4" /> */}
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
                        {/* <BrainCircuit className="mr-2 h-4 w-4 text-muted-foreground" /> */}
                        <span className="font-medium">AI Summary</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{call.summary}</p>
                    </div>
                  )}

                  {call.transcript && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          {/* <FileIcon className="mr-2 h-4 w-4 text-muted-foreground" /> */}
                          <span className="font-medium">Transcript</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedTranscript(expandedTranscript === call.id ? null : call.id)}
                          className="h-8 px-2"
                        >
                          {expandedTranscript === call.id ? (
                            <>
                              {/* <ChevronUpIcon className="h-4 w-4 mr-1" /> */}
                              Hide
                            </>
                          ) : (
                            <>
                              {/* <ChevronDownIcon className="h-4 w-4 mr-1" /> */}
                              Show
                            </>
                          )}
                        </Button>
                      </div>
                      {expandedTranscript === call.id && (
                        <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-line font-sans">{call.transcript}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                {call.recording_url && (
                  <CardFooter className="flex flex-col border-t pt-4 pb-2 space-y-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        {/* <HeadphonesIcon className="mr-2 h-4 w-4 text-muted-foreground" /> */}
                        <span className="text-sm font-medium">Call Recording</span>
                      </div>
                      <a
                        href={call.recording_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-primary hover:underline"
                      >
                        {/* <DownloadIcon className="h-3 w-3 mr-1" /> */}
                        Download
                      </a>
                    </div>
                    <audio
                      controls
                      className="w-full h-8"
                      aria-label={`Call recording from ${formatDate(call.timestamp)}`}
                    >
                      <source src={call.recording_url} type="audio/mpeg" />
                      <track kind="captions" src="" label="English captions" />
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
