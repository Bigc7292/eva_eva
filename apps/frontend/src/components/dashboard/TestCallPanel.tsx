'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Phone, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function TestCallPanel() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [name, setName] = useState('Test User')
  const [scenario, setScenario] = useState('general')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; callId?: string } | null>(null)

  const handleInitiateCall = async () => {
    if (!phoneNumber) {
      setResult({
        success: false,
        message: 'Please enter a phone number'
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)

      const response = await fetch('/api/test-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          name,
          scenario
        })
      })

      const data = await response.json()

      // Check for error in the response data
      if (!response.ok || (data && data.error)) {
        setResult({
          success: false,
          message: data && data.error ? data.error : 'Failed to initiate call'
        })
        return
      }

      setResult({
        success: true,
        message: 'Call initiated successfully!',
        callId: data.callId
      })
    } catch (error) {
      console.error('Error initiating test call:', error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Test Outbound Call</h3>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="phone-number">Phone Number</Label>
          <Input
            id="phone-number"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Recipient Name</Label>
          <Input
            id="name"
            placeholder="Test User"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="scenario">Test Scenario</Label>
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger id="scenario">
              <SelectValue placeholder="Select a scenario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Conversation</SelectItem>
              <SelectItem value="callback">Request Callback</SelectItem>
              <SelectItem value="meeting">Schedule Meeting</SelectItem>
              <SelectItem value="not-interested">Not Interested</SelectItem>
              <SelectItem value="questions">Ask Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleInitiateCall}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Initiating Call...' : 'Initiate Test Call'}
          {!loading && <Phone className="ml-2 h-4 w-4" />}
        </Button>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <>
                <Phone className="h-4 w-4" />
                <AlertTitle>Call Initiated (Mock Mode)</AlertTitle>
                <AlertDescription>
                  {result.message}
                  <div className="mt-2 text-amber-600 font-medium">
                    Note: This is a mock call. In a real environment, VAPI would initiate an actual phone call.
                  </div>
                  {result.callId && (
                    <div className="mt-2">
                      <span className="font-semibold">Call ID:</span> {result.callId}
                    </div>
                  )}
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </>
            )}
          </Alert>
        )}
      </div>
    </Card>
  )
}
