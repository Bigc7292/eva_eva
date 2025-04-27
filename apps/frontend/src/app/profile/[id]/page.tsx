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
import { AudioRecordingsList } from '@/components/audio/AudioRecordingsList'
import { VirtualizedCallList } from '@/components/calls/virtualized-call-list'
// Define interfaces
interface CallStats {
  total_calls: number
  answered_calls: number
  missed_calls: number
  avg_duration: number
  successful_meetings?: number
}

// Import icons from React Icons
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiFile,
  FiMessageSquare,
  FiDownload
} from 'react-icons/fi'
import { formatPhoneNumberForDisplay } from '@/lib/utils/phone-utils'
import styles from './styles.module.css'

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
  transcripts?: Array<{call_id: string, timestamp: string, text: string}>
  summaries?: Array<{call_id: string, timestamp: string, text: string}>
  audio_files?: Array<{call_id: string, timestamp: string, url: string}>
  ai_ratings?: Array<{call_id: string, timestamp: string, rating: number}>
  call_stats?: CallStats
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
  avg_call_duration?: number
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
  ai_rating?: number
}

interface Meeting {
  id: string
  meeting_id: string
  contact_id: string
  timestamp: string
  location: string
  property_type: string
  budget: number
  notes: string
  status: string
  created_at?: string
  updated_at?: string
  lead_id?: string
  call_id?: string
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
          updated_at: String(leadData.updated_at || new Date().toISOString()),
          transcripts: Array.isArray(leadData.transcripts) ? leadData.transcripts : [],
          summaries: Array.isArray(leadData.summaries) ? leadData.summaries : [],
          audio_files: Array.isArray(leadData.audio_files) ? leadData.audio_files : [],
          ai_ratings: Array.isArray(leadData.ai_ratings) ? leadData.ai_ratings : [],
          call_stats: leadData.call_stats ? {
            total_calls: Number((leadData.call_stats as Record<string, unknown>).total_calls || 0),
            answered_calls: Number((leadData.call_stats as Record<string, unknown>).answered_calls || 0),
            missed_calls: Number((leadData.call_stats as Record<string, unknown>).missed_calls || 0),
            avg_duration: Number((leadData.call_stats as Record<string, unknown>).avg_duration || 0)
          } : undefined
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

        // Get call statistics from contact data if available, otherwise calculate from calls
        let totalCalls = 0;
        let answeredCalls = 0;
        let missedCalls = 0;
        let avgDuration = 0;

        // Check if we have call_stats in the contact data
        if (leadData.call_stats && typeof leadData.call_stats === 'object') {
          console.log('Using call_stats from contact data:', leadData.call_stats);
          totalCalls = Number((leadData.call_stats as Record<string, unknown>).total_calls || 0);
          answeredCalls = Number((leadData.call_stats as Record<string, unknown>).answered_calls || 0);
          missedCalls = Number((leadData.call_stats as Record<string, unknown>).missed_calls || 0);
          avgDuration = Number((leadData.call_stats as Record<string, unknown>).avg_duration || 0);
        } else {
          // Calculate call statistics from calls data
          console.log('Calculating call statistics from calls data');
          totalCalls = callsData?.length || 0;

          // Count answered calls - these are calls where the customer engaged with the assistant
          answeredCalls = callsData?.filter(call => {
            const status = String(call.status || call.call_status || '').toLowerCase();
            // Include all statuses that indicate the customer answered and engaged with the call
            return status === 'completed' ||
                   status === 'answered' ||
                   status === 'customer ended call' ||
                   status.includes('customer ended') ||
                   status === 'assistant ended call' ||
                   status.includes('assistant ended') ||
                   status === 'silence timed out';
          }).length || 0;

          // Count missed calls - these are calls where the customer didn't engage
          missedCalls = callsData?.filter(call => {
            const status = String(call.status || call.call_status || '').toLowerCase();
            // Include all statuses that indicate the call was missed or failed
            return status === 'missed' ||
                   status === 'no answer' ||
                   status === 'failed' ||
                   status === 'customer did not answer' ||
                   status.includes('did not answer') ||
                   status === 'customer busy' ||
                   status.includes('busy') ||
                   status === 'voicemail' ||
                   status === 'unknown error' ||
                   status.includes('error');
          }).length || 0;

          // Calculate average duration using the same criteria as for answered calls
          if (answeredCalls > 0) {
            const totalDuration = callsData
              ?.filter(call => {
                const status = String(call.status || call.call_status || '').toLowerCase();
                return status === 'completed' ||
                       status === 'answered' ||
                       status === 'customer ended call' ||
                       status.includes('customer ended') ||
                       status === 'assistant ended call' ||
                       status.includes('assistant ended') ||
                       status === 'silence timed out';
              })
              .reduce((sum, call) => sum + (call.duration || call.call_duration || 0), 0) || 0;

            avgDuration = Math.round(totalDuration / answeredCalls);
          }
        }

        // Get last call date and status
        let lastCallDate = null;
        let lastCallStatus = null;

        if (callsData && callsData.length > 0) {
          lastCallDate = callsData[0].created_at || callsData[0].timestamp;
          lastCallStatus = callsData[0].status || callsData[0].call_status;
        }

        // Fetch meetings data from the database
        let meetingsData = [];
        try {
          const { data: fetchedMeetings, error: meetingsError } = await supabase
            .from('meetings')
            .select('*')
            .eq('contact_id', contactId);

          if (!meetingsError && fetchedMeetings) {
            meetingsData = fetchedMeetings;
          }
        } catch (error) {
          console.error('Error fetching meetings data:', error);
        }

        // Create profile data from contact/lead and calculated metrics
        const profileData: LeadProfile = {
          id: String(leadData.id || ''),
          lead_id: String(leadData.id || ''),
          phone: String(leadData.phone || leadData.phone_number || ''),
          first_contact_date: String(leadData.created_at || new Date().toISOString()),
          successful_meetings: meetingsData?.length || 0, // Use actual meetings count from database
          total_calls: totalCalls,
          answered_calls: answeredCalls,
          missed_calls: missedCalls,
          last_call_date: lastCallDate || '',
          last_call_status: lastCallStatus || '',
          interest_level: String(leadData.interest_level || 'Unknown'),
          created_at: String(leadData.created_at || new Date().toISOString()),
          updated_at: String(leadData.updated_at || new Date().toISOString()),
          avg_call_duration: avgDuration
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
          metadata: call.metadata || null,
          ai_rating: call.ai_rating || null
        })) || []

        setCalls(processedCalls)

        // Process meetings data
        const processedMeetings = meetingsData?.map(meeting => ({
          id: meeting.meeting_id || '',
          meeting_id: meeting.meeting_id || '',
          contact_id: String(contactId || ''),
          timestamp: meeting.meeting_time || meeting.created_at || '',
          status: meeting.status || 'scheduled',
          location: meeting.location || '',
          notes: meeting.notes || '',
          property_type: meeting.type || '',
          budget: meeting.budget || 0
        })) || []

        setMeetings(processedMeetings)
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

  // Helper function to get the appropriate width class based on percentage
  const getProgressWidthClass = (percentage: number) => {
    if (percentage <= 0) return styles.width0
    if (percentage <= 10) return styles.width10
    if (percentage <= 20) return styles.width20
    if (percentage <= 30) return styles.width30
    if (percentage <= 40) return styles.width40
    if (percentage <= 50) return styles.width50
    if (percentage <= 60) return styles.width60
    if (percentage <= 70) return styles.width70
    if (percentage <= 80) return styles.width80
    if (percentage <= 90) return styles.width90
    return styles.width100
  }

  return (
    <div className="container mx-auto py-4 space-y-4">
      {/* Profile Header with Avatar and Actions */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-primary/10">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name)}&background=random`} />
                <AvatarFallback>{lead.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{lead.name}</h1>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(lead.status) as "default" | "secondary" | "success" | "destructive" | "outline"}>
                    {lead.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {profile?.interest_level && (
                    <Badge variant={getInterestLevelBadgeVariant(profile.interest_level) as "default" | "secondary" | "success" | "destructive" | "outline"}>
                      {profile.interest_level} Interest
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    First Contact: {formatDate(profile?.first_contact_date || lead.created_at)}
                  </span>
                </div>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <FiPhone className="mr-1 h-3 w-3" />
                  <span className="mr-3">{lead.phone ? formatPhoneNumberForDisplay(lead.phone) : 'No phone'}</span>
                  <FiMail className="mr-1 h-3 w-3" />
                  <span>{lead.email || 'No email'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm">
                <FiPhone className="mr-2 h-4 w-4" />
                Call Now
              </Button>
              <Button variant="outline" size="sm">
                <FiCalendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button variant="outline" size="sm">
                <FiMessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.total_calls || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span>All-time call count</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Answered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.answered_calls || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span>{profile?.total_calls ? Math.round((profile.answered_calls / profile.total_calls) * 100) : 0}% answer rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Missed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.missed_calls || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span>{profile?.total_calls ? Math.round((profile.missed_calls / profile.total_calls) * 100) : 0}% missed rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.avg_call_duration ? formatDuration(profile.avg_call_duration) : 'N/A'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span>Average call length</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Last Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{profile?.last_call_date ? new Date(profile.last_call_date).toLocaleDateString() : 'Never'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span>{profile?.last_call_status || 'No status'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-6 md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Call History</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Personal</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <FiPhone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{lead.phone ? formatPhoneNumberForDisplay(lead.phone) : 'No phone number'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FiMail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{lead.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FiUser className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{lead.nationality || 'No nationality'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Property Interest</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground mr-2">Type:</span>
                      <span>{lead.property_interest || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground mr-2">Budget:</span>
                      <span>{lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FiMapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{lead.location || 'No location'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {calls.length > 0 ? (
                  <div className="space-y-3">
                    {calls.slice(0, 3).map((call) => (
                      <div key={call.id} className="flex items-start border-b pb-2 last:border-0 last:pb-0">
                        <div className="bg-muted rounded-full p-1 mr-3">
                          <FiPhone className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">{call.call_type} Call</p>
                            <span className="text-xs text-muted-foreground">{formatDate(call.timestamp)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {call.summary || `${call.call_status} - ${formatDuration(call.call_duration)}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm">{lead.notes || 'No notes available'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call History Tab */}
        <TabsContent value="calls">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Call History</CardTitle>
                <Button variant="outline" size="sm">
                  <FiDownload className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No call history available
                </div>
              ) : (
                <VirtualizedCallList
                  calls={calls}
                  height={600}
                  className="pb-4"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings">
          <AudioRecordingsList contactId={leadId} />
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Scheduled Meetings</CardTitle>
                <Button variant="outline" size="sm">
                  <FiCalendar className="mr-2 h-4 w-4" />
                  Add Meeting
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No meetings scheduled
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Meeting</span>
                          <Badge variant={meeting.status === 'completed' ? 'success' : meeting.status === 'cancelled' ? 'destructive' : 'outline'}>
                            {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(meeting.timestamp)}</span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center">
                          <FiMapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span>{meeting.location || 'No location'}</span>
                        </div>
                        {meeting.property_type && (
                          <div className="flex items-center">
                            <span>Property Type: {meeting.property_type}</span>
                          </div>
                        )}
                        {meeting.budget > 0 && (
                          <div className="flex items-center">
                            <span>Budget: ${meeting.budget.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {meeting.notes && (
                        <div className="mt-2 bg-muted/30 p-3 rounded-md">
                          <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Contact Notes</CardTitle>
                <Button variant="outline" size="sm">
                  <FiFile className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!lead.notes ? (
                <div className="py-6 text-center text-muted-foreground">
                  No notes available for this contact
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">General Notes</h3>
                      <span className="text-xs text-muted-foreground">Last updated: {formatDate(lead.updated_at)}</span>
                    </div>
                    <p className="whitespace-pre-line text-sm">{lead.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Call Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Call analytics visualization will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Call Answer Rate</span>
                      <span className="text-sm font-medium">
                        {profile?.total_calls ? Math.round((profile.answered_calls / profile.total_calls) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`${styles.progressBar} ${styles.progressBlue} ${getProgressWidthClass(profile?.total_calls ? Math.round((profile.answered_calls / profile.total_calls) * 100) : 0)}`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Meeting Conversion</span>
                      <span className="text-sm font-medium">
                        {profile?.total_calls ? Math.round((profile.successful_meetings / profile.total_calls) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`${styles.progressBar} ${styles.progressGreen} ${getProgressWidthClass(profile?.total_calls ? Math.round((profile.successful_meetings / profile.total_calls) * 100) : 0)}`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Average Call Quality</span>
                      <span className="text-sm font-medium">
                        {calls.some(call => call.ai_rating)
                          ? (calls.reduce((sum, call) => sum + (call.ai_rating || 0), 0) /
                             calls.filter(call => call.ai_rating).length).toFixed(1)
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`${styles.progressBar} ${styles.progressAmber} ${getProgressWidthClass(calls.some(call => call.ai_rating)
                          ? Math.round((calls.reduce((sum, call) => sum + (call.ai_rating || 0), 0) /
                             calls.filter(call => call.ai_rating).length) * 10)
                          : 0)}`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audio Recordings Section */}
          <div className="mt-4">
            <AudioRecordingsList contactId={leadId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
