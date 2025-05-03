'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowLeft,
  PhoneIncoming,
  PhoneOutgoing,
  MessageSquare
} from 'lucide-react'
import { callsService } from '@/services/calls'
import { leadsService } from '@/services/leads'
import { Call } from '@/lib/dummy-data'
import { formatDistanceToNow, format } from 'date-fns'

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [call, setCall] = useState<Call | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  
  useEffect(() => {
    if (params.id) {
      loadCallData(params.id as string)
    }
  }, [params.id])
  
  const loadCallData = async (id: string) => {
    try {
      setLoading(true)
      const callData = await callsService.getCall(id)
      if (callData) {
        setCall(callData)
      }
    } catch (error) {
      console.error('Error loading call:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleViewLead = () => {
    if (call) {
      router.push(`/leads/${call.leadId}`)
    }
  }
  
  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2">Loading call details...</p>
        </div>
      </div>
    )
  }
  
  if (!call) {
    return (
      <div className="flex-1 p-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calls
        </Button>
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Call Not Found</h2>
          <p className="text-muted-foreground">The call you're looking for doesn't exist or has been removed.</p>
        </Card>
      </div>
    )
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p')
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
          Back to Calls
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleViewLead}>
            <User className="mr-2 h-4 w-4" />
            View Lead
          </Button>
        </div>
      </div>
      
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${call.callType === 'Inbound' ? 'bg-green-100' : 'bg-blue-100'}`}>
              {call.callType === 'Inbound' ? 
                <PhoneIncoming className="h-6 w-6 text-green-600" /> : 
                <PhoneOutgoing className="h-6 w-6 text-blue-600" />
              }
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {call.callType} Call {call.callStatus !== 'Completed' && `(${call.callStatus})`}
              </h2>
              <p className="text-muted-foreground">{call.retellCallId}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{formatDate(call.timestamp)}</p>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(call.timestamp)}</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-medium mb-3">Call Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Lead: {call.leadName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Phone: {call.leadPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Duration: {
                    call.callStatus === 'Completed' 
                      ? `${Math.floor(call.callDuration / 60)}m ${call.callDuration % 60}s`
                      : 'N/A'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Date: {formatDate(call.timestamp)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Call Summary</h3>
            <p className="text-sm text-muted-foreground">
              {call.detailedCallSummary || 'No summary available for this call.'}
            </p>
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTranscript(!showTranscript)}
              >
                <FileText className="mr-2 h-4 w-4" />
                {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
              </Button>
            </div>
            
            {showTranscript && (
              <div className="mt-4 p-4 bg-muted rounded-md text-sm">
                <p className="font-medium mb-2">Call Transcript</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="font-medium">Agent:</span>
                    <span>Hello, this is Eva from Top Loader Real Estate. How can I help you today?</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">Customer:</span>
                    <span>Hi, I'm interested in properties in Dubai Marina.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">Agent:</span>
                    <span>Great! I'd be happy to help you find the perfect property in Dubai Marina. Could you tell me a bit more about what you're looking for? Are you interested in apartments or villas?</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">Customer:</span>
                    <span>I'm looking for a 2-bedroom apartment with a view of the marina.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">Agent:</span>
                    <span>Perfect. And what's your budget range for this property?</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">Customer:</span>
                    <span>Around 1.5 to 2 million AED.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {call.audioUrl && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Call Recording</h3>
            <audio controls className="w-full">
              <source src={call.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Add Note
          </Button>
          <Button>
            <Phone className="mr-2 h-4 w-4" />
            Call Back
          </Button>
        </div>
      </Card>
    </div>
  )
}
