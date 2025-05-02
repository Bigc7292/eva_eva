'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, X } from 'lucide-react'
import { vapiService } from '@/lib/services/vapi'
import { toast } from '@/components/ui/use-toast'

export function AdvancedTestCallPanel() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [callId, setCallId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  // Advanced settings
  const [silenceTimeout, setSilenceTimeout] = useState(15000) // Increased from 5000 to 15000
  const [maxDuration, setMaxDuration] = useState(1800) // Increased from 600 to 1800 (30 minutes)
  const [endOnSilence, setEndOnSilence] = useState(false) // Changed from true to false
  const [endAfterCompletion, setEndAfterCompletion] = useState(false) // Changed from true to false
  const [speechModel, setSpeechModel] = useState('whisper-large-v3')
  const [vadFilter, setVadFilter] = useState(true)
  const [vadThreshold, setVadThreshold] = useState(0.5)

  // Call logs
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toISOString()}] ${message}`, ...prev])
  }

  const handleInitiateCall = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please enter a phone number to call',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)
      addLog(`Initiating call to ${phoneNumber}...`)

      // Prepare metadata with advanced settings
      const metadata: Record<string, unknown> = {}

      if (activeTab === 'advanced') {
        metadata.call_settings = {
          silence_timeout_ms: silenceTimeout,
          max_duration_seconds: maxDuration,
          end_call_on_silence: endOnSilence,
          end_call_after_completion: endAfterCompletion
        }

        metadata.speech_recognition_settings = {
          model: speechModel,
          vad_filter: vadFilter,
          vad_threshold: vadThreshold
        }

        addLog(`Using advanced settings: ${JSON.stringify(metadata, null, 2)}`)
      }

      const result = await vapiService.initiateCall(phoneNumber, metadata)
      setCallId(result.id)
      addLog(`Call initiated successfully! Call ID: ${result.id}`)

      toast({
        title: 'Call initiated',
        description: `Call to ${phoneNumber} has been initiated successfully.`
      })
    } catch (error) {
      console.error('Error initiating call:', error)
      addLog(`Error initiating call: ${error instanceof Error ? error.message : String(error)}`)

      toast({
        title: 'Error initiating call',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndCall = async () => {
    if (!callId) {
      toast({
        title: 'No active call',
        description: 'There is no active call to end',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)
      addLog(`Ending call ${callId}...`)

      await vapiService.endCall(callId)
      addLog(`Call ${callId} ended successfully`)

      toast({
        title: 'Call ended',
        description: 'The call has been ended successfully.'
      })

      setCallId(null)
    } catch (error) {
      console.error('Error ending call:', error)
      addLog(`Error ending call: ${error instanceof Error ? error.message : String(error)}`)

      toast({
        title: 'Error ending call',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Test Call</CardTitle>
        <CardDescription>
          Test outbound calls with advanced configuration options
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <CardContent>
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="+971565401583"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a phone number in international format (e.g., +971565401583)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Call Settings</h3>

              <div className="space-y-2">
                <Label>Silence Timeout (ms)</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[silenceTimeout]}
                    min={1000}
                    max={20000}
                    step={1000}
                    onValueChange={(value) => setSilenceTimeout(value[0])}
                  />
                  <span className="w-12 text-right">{silenceTimeout}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  How long to wait in silence before ending the call (ms)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Call Duration (seconds)</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[maxDuration]}
                    min={60}
                    max={1800}
                    step={60}
                    onValueChange={(value) => setMaxDuration(value[0])}
                  />
                  <span className="w-12 text-right">{maxDuration}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum duration of the call in seconds (1-30 minutes)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="endOnSilence"
                  checked={endOnSilence}
                  onCheckedChange={(checked) => setEndOnSilence(checked === true)}
                />
                <Label htmlFor="endOnSilence">End call on silence</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="endAfterCompletion"
                  checked={endAfterCompletion}
                  onCheckedChange={(checked) => setEndAfterCompletion(checked === true)}
                />
                <Label htmlFor="endAfterCompletion">End call after assistant completes response</Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Speech Recognition Settings</h3>

              <div className="space-y-2">
                <Label htmlFor="speechModel">Speech Recognition Model</Label>
                <Select value={speechModel} onValueChange={setSpeechModel}>
                  <SelectTrigger id="speechModel">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whisper-large-v3">Whisper Large v3 (Most Accurate)</SelectItem>
                    <SelectItem value="whisper-medium">Whisper Medium (Balanced)</SelectItem>
                    <SelectItem value="whisper-small">Whisper Small (Fastest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vadFilter"
                  checked={vadFilter}
                  onCheckedChange={(checked) => setVadFilter(checked === true)}
                />
                <Label htmlFor="vadFilter">Voice Activity Detection (VAD) Filter</Label>
              </div>

              <div className="space-y-2">
                <Label>VAD Threshold</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[vadThreshold]}
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    onValueChange={(value) => setVadThreshold(value[0])}
                    disabled={!vadFilter}
                  />
                  <span className="w-12 text-right">{vadThreshold.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lower values detect more speech, higher values filter more noise
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="h-[300px] overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No logs yet. Initiate a call to see logs here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={`log-${index}-${log.substring(0, 20)}`} className="border-b border-border py-1 last:border-0">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>

      <CardFooter className="flex justify-between">
        <div>
          {activeTab === 'logs' && (
            <Button variant="outline" onClick={clearLogs} disabled={logs.length === 0}>
              Clear Logs
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          {callId ? (
            <Button variant="destructive" onClick={handleEndCall} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              End Call
            </Button>
          ) : (
            <Button onClick={handleInitiateCall} disabled={isLoading}>
              <Phone className="mr-2 h-4 w-4" />
              Start Call
            </Button>
          )}
        </div>
      </CardFooter>

      {callId && (
        <div className="bg-muted px-6 py-2 text-sm">
          <div className="flex items-center">
            <X className="mr-2 h-4 w-4 text-primary" />
            <span>Active Call ID: {callId}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

