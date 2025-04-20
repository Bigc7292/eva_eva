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
import { Phone, Mail, MapPin, Calendar, Clock, User } from 'lucide-react' // Removed FileText, AudioLines, MessageSquare due to missing exports. Use alternatives below if needed.
// import { FileText, AudioLines, MessageSquare } from 'lucide-react' // <-- Not available in your version. Use description text or other icons if needed.

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  property_interest: string;
  budget: number;
  location: string;
  nationality: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Call {
  id: string;
  call_id: string;
  lead_id: string;
  phone_number: string;
  call_type: string;
  call_status: string;
  call_outcome?: string;
  timestamp: string;
  end_time?: string;
  call_duration?: number;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  meeting_scheduled?: boolean;
  meeting_time?: string;
  callback_scheduled?: boolean;
  callback_time?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  agent_name?: string;
}

export default function LeadProfilePage() {
  const params = useParams();
  const leadId = params.id as string;

  const [leads, setLeads] = useState<Lead[]>([]); // All leads for phone number
  const [calls, setCalls] = useState<Call[]>([]); // All calls for phone number
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Find the lead by leadId to get the phone number
        const { data: leadData, error: leadError } = await supabase
          .from('enhanced_leads')
          .select('*')
          .eq('lead_id', leadId)
          .single();

        if (leadError) throw new Error(`Error fetching lead: ${leadError.message}`);
        if (!leadData) throw new Error('Lead not found');
        const phone = leadData.phone_number || leadData.phone;
        setPhoneNumber(phone);

        // 2. Fetch ALL leads with this phone number
        const { data: allLeads, error: allLeadsError } = await supabase
          .from('enhanced_leads')
          .select('*')
          .eq('phone_number', phone);
        if (allLeadsError) throw new Error(`Error fetching leads for phone: ${allLeadsError.message}`);
        setLeads((allLeads || []).map(ld => ({
          id: ld.lead_id,
          name: ld.name || 'Unknown',
          phone: ld.phone_number || ld.phone || '',
          email: ld.email || '',
          status: ld.status || 'new',
          property_interest: ld.property_interest || '',
          budget: ld.budget || 0,
          location: ld.location || '',
          nationality: ld.nationality || '',
          notes: ld.notes || '',
          created_at: ld.created_at,
          updated_at: ld.updated_at
        })));

        // 3. Fetch ALL calls with this phone number
        const { data: allCalls, error: callsError } = await supabase
          .from('enhanced_calls')
          .select('*')
          .eq('phone_number', phone)
          .order('timestamp', { ascending: false });
        if (callsError) throw new Error(`Error fetching calls: ${callsError.message}`);
        setCalls(allCalls || []);

        // 4. (Optional) Fetch meetings if you have them for phone number
        // setMeetings([]); // Implement if meetings are tied to phone number
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLeads([]);
        setCalls([]);
      } finally {
        setLoading(false);
      }
    }
    if (leadId) fetchProfileData();
  }, [leadId]);


          // Removed: legacy profileData aggregation. Each lead is mapped in setLeads, and calls are handled separately.
          // If you need to display aggregated info, use the leads and calls state variables.
          // No need to setProfile or use profileData here.


        // Get the lead's phone number
        // Legacy/incorrect code removed. Calls and leads are managed through fetchProfileData and setCalls/setLeads in the main useEffect.
        // No references to leadData, setMeetings, or fetchLeadData should remain.

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

  if (!leads || leads.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The lead(s) you are looking for do not exist or have been removed.</p>
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
        return 'outline'
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
        return 'outline'
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
      <>
        {leads.map((lead) => (
          <div key={lead.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name)}&background=random`} />
                <AvatarFallback>{lead.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{lead.name}</h1>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Badge variant={getStatusBadgeVariant(lead?.status)}>
                    {lead.status?.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </Badge>
                  {/* Optionally show interest level if present */}
                  {lead.property_interest && (
                    <Badge variant={getInterestLevelBadgeVariant(lead.property_interest)}>
                      {lead.property_interest} Interest
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
                <span className="mr-2 h-4 w-4 text-muted-foreground">💬</span>
                Send Message
              </Button>
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
                    <span className="mr-2 h-4 w-4 text-muted-foreground">👥</span>
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
                    <span>{lead.budget ? `$${lead.budget}` : 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Notes:</span>
                    <span>{lead.notes || 'No notes'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </>
      <Tabs defaultValue="calls" className="mt-8">
        <TabsList>
          <TabsTrigger value="calls">Calls</TabsTrigger>
        </TabsList>
        <TabsContent value="calls" className="space-y-4">
          {calls.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No calls found
              </CardContent>
            </Card>
          ) : (
            calls.map((call) => (
              <Card key={call.call_id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">Call</CardTitle>
                      <Badge variant={getStatusBadgeVariant(call.call_status)}>
                        {call.call_status.charAt(0).toUpperCase() + call.call_status.slice(1)}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(call.timestamp)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <Mail className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{call.phone_number}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{call.agent_name || 'Unknown'}</span>
                    </div>
                  </div>
                  {call.summary && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center mb-1">
                        <span className="mr-2 h-4 w-4 text-muted-foreground">📝</span>
                        <span className="font-medium">Summary</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{call.summary}</p>
                    </div>
                  )}
                  {call.transcript && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center mb-1">
                        <span className="mr-2 h-4 w-4 text-muted-foreground">💬</span>
                        <span className="font-medium">Transcript</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{call.transcript}</p>
                    </div>
                  )}
                </CardContent>
                {call.recording_url && (
                  <CardFooter className="flex justify-between border-t pt-4 pb-2">
                    <div className="flex items-center">
                      <span className="mr-2 h-4 w-4 text-muted-foreground">🎵</span>
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
      </Tabs>
    </div>
  )
}
