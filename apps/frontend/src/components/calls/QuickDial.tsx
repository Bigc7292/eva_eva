'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { PhoneCall, User, Mail, Check, AlertCircle } from 'lucide-react'
import { databaseService } from '@/services/database'
import { callService } from '@/services/call-service'
import { useToast } from '@/components/ui/use-toast'

export function QuickDial() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isDialing, setIsDialing] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { toast } = useToast()

  const handleDial = async () => {
    if (!name || !phone) {
      toast({
        title: 'Missing information',
        description: 'Please enter at least a name and phone number.',
        variant: 'destructive'
      })
      return
    }
    
    setIsDialing(true)
    setCallStatus('idle')
    
    try {
      // Create a temporary lead
      const now = new Date().toISOString()
      const leadId = `lead-quickdial-${Date.now()}`
      const crmId = `CRM-${Math.floor(Math.random() * 10000)}`
      
      const lead = {
        id: leadId,
        crmId,
        name,
        phone,
        email,
        gender: '',
        location: '',
        propertyInterest: 'Not specified',
        investmentType: 'Not specified',
        budgetRange: 'Not specified',
        preferredAreas: [],
        status: 'New',
        priority: 'Medium',
        rating: 0,
        aiSentiment: 0,
        aiNotes: '',
        source: 'Quick Dial',
        notes: 'Created from Quick Dial',
        createdAt: now,
        updatedAt: now,
        interactions: [],
        totalCalls: 0,
        lastContactDate: now,
        nextFollowUp: null,
        assignedAgent: null
      }
      
      // Save the lead to the database
      databaseService.saveLead(lead)
      
      // Make the call
      const callId = await callService.makeCall({
        phoneNumber: phone,
        leadId,
        leadName: name,
        leadEmail: email,
        propertyInterest: 'Not specified',
        budget: 'Not specified',
        location: '',
        sendSmsNotification: true
      })
      
      // Create a call record
      const call = {
        id: callId,
        retellCallId: '',
        timestamp: now,
        callDuration: 0, // Will be updated when the call completes
        callType: 'Outbound',
        callStatus: 'In Progress',
        audioUrl: '',
        detailedCallSummary: `Quick dial call to ${name}`,
        leadId,
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        transcript: null,
        sentimentScore: 0,
        keyTopics: ['Quick Dial'],
        nextSteps: '',
        agentId: 'voicegenie-agent-1',
        agentName: 'VoiceGenie AI Assistant'
      }
      
      databaseService.saveCall(call)
      
      // Add interaction to the lead
      const interaction = {
        type: 'Call',
        timestamp: now,
        details: `Quick dial call to ${phone}`,
        duration: 0, // Will be updated when the call completes
        outcome: 'In Progress',
        callId,
        audioUrl: '',
        transcript: ''
      }
      
      databaseService.saveInteraction(leadId, interaction)
      
      setCallStatus('success')
      setIsDialing(false)
      
      toast({
        title: 'Call initiated',
        description: `Calling ${name} at ${phone}`,
        variant: 'default'
      })
      
      // Reset form
      setName('')
      setPhone('')
      setEmail('')
    } catch (error) {
      console.error('Error making call:', error)
      setCallStatus('error')
      setIsDialing(false)
      
      toast({
        title: 'Error making call',
        description: 'An error occurred while trying to make the call.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Quick Dial</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Name</label>
          <div className="flex">
            <div className="bg-muted p-2 rounded-l-md border border-r-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="rounded-l-none"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Phone Number</label>
          <div className="flex">
            <div className="bg-muted p-2 rounded-l-md border border-r-0">
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              className="rounded-l-none"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Email (Optional)</label>
          <div className="flex">
            <div className="bg-muted p-2 rounded-l-md border border-r-0">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className="rounded-l-none"
            />
          </div>
        </div>
        
        {callStatus === 'success' && (
          <div className="bg-green-100 text-green-800 p-3 rounded-md flex items-center">
            <Check className="h-4 w-4 mr-2" />
            Call initiated successfully.
          </div>
        )}
        
        {callStatus === 'error' && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Error making call. Please try again.
          </div>
        )}
        
        <Button 
          className="w-full"
          onClick={handleDial}
          disabled={isDialing || !name || !phone}
        >
          {isDialing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              Dialing...
            </>
          ) : (
            <>
              <PhoneCall className="h-4 w-4 mr-2" />
              Dial Now
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
