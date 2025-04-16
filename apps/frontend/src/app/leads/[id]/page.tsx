'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heading } from '@/components/ui/heading'
import {
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Clock,
  Star,
  FileText,
  ArrowLeft,
  Building,
  DollarSign,
  PhoneCall,
  MessageSquare,
  BarChart,
  Users,
  Play,
  Volume2
} from 'lucide-react'
import { leadsService } from '@/services/leads'
import { callsService } from '@/services/calls'
import { Lead, Call, Interaction } from '@/services/leads'
import { formatDistanceToNow, format } from 'date-fns'
import { CallRecording } from '@/components/leads/CallRecording'
import { supabase } from '@/lib/services/supabase'

export default function LeadProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadLeadData(params.id as string)
    }
  }, [params.id])

  const loadLeadData = async (id: string) => {
    try {
      setLoading(true)
      const leadData = await leadsService.getLead(id)
      if (leadData) {
        setLead(leadData)

        // Load calls for this lead
        try {
          // First try to get calls from Supabase
          const { data: supabaseCalls, error } = await supabase
            .from('calls')
            .select('*')
            .eq('metadata->lead_id', id)
            .order('start_time', { ascending: false })

          if (error) {
            console.error('Error loading calls from Supabase:', error)
            // Fall back to service
            const callsData = await callsService.getCallsByLead(id)
            setCalls(callsData)
          } else if (supabaseCalls && supabaseCalls.length > 0) {
            // Map Supabase calls to the expected format
            const formattedCalls = supabaseCalls.map(call => ({
              id: call.id.toString(),
              retellCallId: call.call_id,
              timestamp: call.start_time,
              callDuration: call.duration || 0,
              callType: call.metadata?.direction || 'Outbound',
              callStatus: call.status === 'ended' ? 'Completed' : call.status,
              audioUrl: call.recording_url,
              detailedCallSummary: call.metadata?.summary || '',
              leadId: id,
              leadName: leadData.name,
              transcript: null
            }))
            setCalls(formattedCalls)
          } else {
            // Fall back to service if no calls found
            const callsData = await callsService.getCallsByLead(id)
            setCalls(callsData)
          }
        } catch (error) {
          console.error('Error loading calls:', error)
          // Fall back to service
          const callsData = await callsService.getCallsByLead(id)
          setCalls(callsData)
        }
      }
    } catch (error) {
      console.error('Error loading lead:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateCall = async () => {
    if (!lead) return

    try {
      await leadsService.initiateCall(lead.id)
      // Reload lead data after initiating call
      loadLeadData(lead.id)
    } catch (error) {
      console.error('Error initiating call:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2">Loading lead profile...</p>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex-1 p-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Lead Not Found</h2>
          <p className="text-muted-foreground">The lead you're looking for doesn't exist or has been removed.</p>
        </Card>
      </div>
    )
  }

  // Calculate star rating display
  const renderRating = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP')
    } catch (e) {
      return 'Invalid date'
    }
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return 'Unknown'
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleInitiateCall}>
            <Phone className="mr-2 h-4 w-4" />
            Call Lead
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{lead.name}</h2>
              <p className="text-muted-foreground">{lead.crmId}</p>
            </div>
            <div className="flex items-center gap-1">
              {renderRating(lead.rating)}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{lead.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{lead.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{lead.gender}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>Interest: {lead.propertyInterest}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Budget: {lead.budgetRange}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created: {formatDate(lead.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Last Contact: {formatRelativeTime(lead.lastContactDate)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Preferred Areas</h3>
            <div className="flex flex-wrap gap-2">
              {lead.preferredAreas.map((area, index) => (
                <span key={index} className="px-2 py-1 bg-muted rounded-md text-sm">
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground">{lead.notes}</p>
          </div>

          {lead.aiNotes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h3 className="font-medium mb-1 flex items-center">
                <BarChart className="h-4 w-4 mr-1" />
                AI Analysis
              </h3>
              <p className="text-sm">{lead.aiNotes}</p>
              <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${lead.aiSentiment * 100}%` }}
                />
              </div>
              <p className="text-xs text-right mt-1">Sentiment Score: {(lead.aiSentiment * 100).toFixed(0)}%</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-4">Lead Status</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${lead.status === 'Interested' ? 'bg-green-100 text-green-800' :
                    lead.status === 'Not Interested' ? 'bg-red-100 text-red-800' :
                    lead.status === 'Callback' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'}`}>
                  {lead.status}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Priority</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${lead.priority === 'High' ? 'bg-red-100 text-red-800' :
                    lead.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'}`}>
                  {lead.priority}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Source</span>
                <span className="text-sm font-medium">{lead.source}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Total Calls</span>
                <span className="text-sm font-medium">{lead.totalCalls}</span>
              </div>
            </div>

            {lead.assignedAgent && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Assigned Agent</span>
                  <span className="text-sm font-medium">{lead.assignedAgent}</span>
                </div>
              </div>
            )}

            {lead.nextFollowUp && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <h4 className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Next Follow-up
                </h4>
                <p className="text-sm mt-1">{formatDate(lead.nextFollowUp)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(lead.nextFollowUp)}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="interactions" className="mt-6">
        <TabsList>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="interactions" className="mt-4">
          <Card className="p-6">
            <h3 className="font-medium mb-4">Interaction History</h3>

            <div className="space-y-4">
              {lead.interactions.length > 0 ? (
                lead.interactions
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((interaction, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full
                          ${interaction.type === 'Call' ? 'bg-blue-100' :
                            interaction.type === 'Email' ? 'bg-green-100' :
                            interaction.type === 'Meeting' ? 'bg-purple-100' :
                            'bg-gray-100'}`}>
                          {interaction.type === 'Call' ? <PhoneCall className="h-4 w-4" /> :
                            interaction.type === 'Email' ? <Mail className="h-4 w-4" /> :
                            interaction.type === 'Meeting' ? <Users className="h-4 w-4" /> :
                            <MessageSquare className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{interaction.type}</h4>
                            <span className="text-sm text-muted-foreground">
                              {formatRelativeTime(interaction.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{interaction.details}</p>

                          {interaction.duration && (
                            <div className="flex items-center mt-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                {interaction.type === 'Call'
                                  ? `${Math.floor(interaction.duration / 60)}m ${interaction.duration % 60}s`
                                  : `${Math.floor(interaction.duration / 3600)}h ${Math.floor((interaction.duration % 3600) / 60)}m`}
                              </span>
                            </div>
                          )}

                          {interaction.outcome && (
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full
                                ${interaction.outcome === 'Positive' ? 'bg-green-100 text-green-800' :
                                  interaction.outcome === 'Neutral' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'}`}>
                                {interaction.outcome}
                              </span>
                            </div>
                          )}

                          {interaction.transcript && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <div className="flex items-center mb-1">
                                <FileText className="h-3 w-3 mr-1" />
                                <span className="font-medium text-xs">Transcript</span>
                              </div>
                              <p className="text-xs whitespace-pre-line">{interaction.transcript}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-sm">No interactions recorded yet.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="mt-4">
          <Card className="p-6">
            <h3 className="font-medium mb-4">Call History</h3>

            <div className="space-y-4">
              {calls.length > 0 ? (
                calls
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((call, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full
                          ${call.callType === 'Inbound' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          <PhoneCall className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">
                              {call.callType} Call {call.callStatus === 'Completed' ? '' : `(${call.callStatus})`}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {formatRelativeTime(call.timestamp)}
                            </span>
                          </div>

                          <div className="flex items-center mt-1 text-sm">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>
                              {call.callStatus === 'Completed'
                                ? `${Math.floor(call.callDuration / 60)}m ${call.callDuration % 60}s`
                                : 'N/A'}
                            </span>

                            {call.agentName && (
                              <>
                                <span className="mx-2">•</span>
                                <User className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span>{call.agentName}</span>
                              </>
                            )}
                          </div>

                          {call.detailedCallSummary && (
                            <p className="text-sm mt-2">{call.detailedCallSummary}</p>
                          )}

                          {call.keyTopics && call.keyTopics.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {call.keyTopics.map((topic, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}

                          {call.transcript && (
                            <div className="mt-3">
                              <Button variant="outline" size="sm" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                View Transcript
                              </Button>
                            </div>
                          )}

                          {call.audioUrl && (
                            <CallRecording
                              audioUrl={call.audioUrl}
                              callId={call.retellCallId || call.id}
                              timestamp={call.timestamp}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-sm">No calls recorded yet.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card className="p-6">
            <h3 className="font-medium mb-4">Documents</h3>
            <p className="text-muted-foreground text-sm">No documents available for this lead.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
