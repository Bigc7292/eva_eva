'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Phone, Loader2, Clock, Info, FileText, Headphones } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CallStatus {
  id: string;
  status: string;
  to?: string;
  from?: string;
  direction?: string;
  transcript?: string;
  recording_url?: string;
  duration?: number;
  created_at?: string;
  updated_at?: string;
}

export default function SingleCallPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [leadId, setLeadId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; call?: CallStatus } | null>(null)
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null)
  const { toast } = useToast()

  // Poll for call status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (polling && result?.success && result.call?.id) {
      // Start polling for call status
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/calls/status/${result.call?.id}`);
          if (response.ok) {
            const data = await response.json();
            setCallStatus(data.call);

            // If call is completed or failed, stop polling
            if (['completed', 'failed', 'error'].includes(data.call.status)) {
              setPolling(false);
            }
          } else {
            console.error('Failed to fetch call status');
          }
        } catch (error) {
          console.error('Error polling call status:', error);
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [polling, result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please enter a phone number to make a call',
        variant: 'destructive'
      })
      return
    }

    // Basic phone number validation
    const phoneRegex = /^\+[0-9]{8,15}$/;
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
    setCallStatus(null)

    try {
      const response = await fetch('/api/calls/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          leadId: leadId || undefined,
          metadata: {
            notes,
            source: 'single-call-page'
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Call initiated successfully',
          call: data.call
        })

        // Set initial call status and start polling
        setCallStatus(data.call)
        setPolling(true)

        toast({
          title: 'Call initiated',
          description: `Call to ${phoneNumber} has been initiated successfully`,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to initiate call'
        })
        toast({
          title: 'Call failed',
          description: data.error || 'Failed to initiate call',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error initiating call:', error)
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

  // Get status badge color based on call status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'initiated':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">Initiated</Badge>
      case 'ringing':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">Ringing</Badge>
      case 'in-progress':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">In Progress</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">Completed</Badge>
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300">Failed</Badge>
      case 'error':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Make a Single Call</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
            <CardDescription>
              Enter the details for the call you want to make
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} id="call-form">
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
              form="call-form"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Initiating Call...' : 'Make Call'}
              {!loading && <Phone className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Status</CardTitle>
              <CardDescription>
                The status of your call will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3">Initiating call...</span>
                </div>
              )}

              {!loading && !result && (
                <div className="text-center py-8 text-muted-foreground">
                  No call initiated yet
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <Alert variant={result.success ? "default" : "destructive"}>
                    {result.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {result.success ? 'Call Initiated' : 'Call Failed'}
                    </AlertTitle>
                    <AlertDescription>
                      {result.message}
                    </AlertDescription>
                  </Alert>

                  {result?.success && (callStatus || result.call) && (
                    <div className="border rounded-md overflow-hidden">
                      <Tabs defaultValue="details">
                        <TabsList className="w-full">
                          <TabsTrigger value="details">Call Details</TabsTrigger>
                          {callStatus?.transcript && (
                            <TabsTrigger value="transcript">Transcript</TabsTrigger>
                          )}
                          {callStatus?.recording_url && (
                            <TabsTrigger value="recording">Recording</TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="details" className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">Call Information</h3>
                              {getStatusBadge(callStatus?.status || result.call?.status || 'unknown')}
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-3">
                                <span className="text-muted-foreground">Call ID:</span>
                                <span className="col-span-2">{callStatus?.id || result.call?.id}</span>
                              </div>
                              <div className="grid grid-cols-3">
                                <span className="text-muted-foreground">Phone:</span>
                                <span className="col-span-2">{callStatus?.to || result.call?.to}</span>
                              </div>
                              {callStatus?.created_at && (
                                <div className="grid grid-cols-3">
                                  <span className="text-muted-foreground">Started:</span>
                                  <span className="col-span-2">{new Date(callStatus.created_at).toLocaleString()}</span>
                                </div>
                              )}
                              {callStatus?.duration && (
                                <div className="grid grid-cols-3">
                                  <span className="text-muted-foreground">Duration:</span>
                                  <span className="col-span-2">{callStatus.duration} seconds</span>
                                </div>
                              )}
                            </div>

                            {polling && (
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-2" />
                                  <span>Updating call status...</span>
                                </div>
                                <Progress value={25} className="h-1" />
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {callStatus?.transcript && (
                          <TabsContent value="transcript" className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                <h3 className="font-medium">Call Transcript</h3>
                              </div>
                              <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                                {callStatus.transcript}
                              </div>
                            </div>
                          </TabsContent>
                        )}

                        {callStatus?.recording_url && (
                          <TabsContent value="recording" className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center">
                                <Headphones className="h-4 w-4 mr-2" />
                                <h3 className="font-medium">Call Recording</h3>
                              </div>
                              <audio controls className="w-full">
                                <source src={callStatus.recording_url} type="audio/mpeg" />
                                <track kind="captions" src="" label="English captions" />
                                Your browser does not support the audio element.
                              </audio>
                              <div className="text-sm">
                                <a
                                  href={callStatus.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Download recording
                                </a>
                              </div>
                            </div>
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
                  )}
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
                  <strong>How it works:</strong> This page allows you to initiate a single call using the VAPI service.
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Enter the phone number with country code</li>
                  <li>Optionally add a lead ID if this call is for an existing lead</li>
                  <li>Add any notes about the call</li>
                  <li>Click "Make Call" to initiate the call</li>
                </ol>
                <p>
                  The call will be handled by our AI assistant, which will engage with the customer and collect information.
                </p>
                <p>
                  Call details, transcripts, and recordings will be available in the Calls section once the call is completed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
