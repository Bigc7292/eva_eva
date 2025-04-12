import { dummyCalls, dummyCallAnalytics, Call, CallAnalytics } from '@/lib/dummy-data'
import type { InboundCall, OutboundCall } from '@/types'

export const callsService = {
  async makeCall(leadId: string, phone: string) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Generate a random call ID
      const callId = `call-${Date.now()}`
      console.log(`Making call to ${phone} for lead ${leadId}`)

      return callId
    } catch (error) {
      console.error('Error making call:', error)
      throw error
    }
  },

  async getCallHistory(leadId: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 400))
    return dummyCalls.filter(call => call.leadId === leadId) as (InboundCall | OutboundCall)[]
  },

  async getCalls() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return dummyCalls
  },

  async getCall(id: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    return dummyCalls.find(call => call.id === id)
  },

  async getCallsByLead(leadId: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 400))
    return dummyCalls.filter(call => call.leadId === leadId)
  },

  async getCallTranscript(callId: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    const call = dummyCalls.find(call => call.id === callId)
    return call?.transcript || null
  },

  async getCallAudio(callId: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    const call = dummyCalls.find(call => call.id === callId)
    return call?.audioUrl || null
  },

  async getCallAnalytics() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600))
    return dummyCallAnalytics
  },

  async getCallAnalyticsByLead(leadId: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const leadCalls = dummyCalls.filter(call => call.leadId === leadId)

    return {
      totalCalls: leadCalls.length,
      inboundCalls: leadCalls.filter(call => call.callType === 'Inbound').length,
      outboundCalls: leadCalls.filter(call => call.callType === 'Outbound').length,
      missedCalls: leadCalls.filter(call => call.callStatus === 'Missed').length,
      completedCalls: leadCalls.filter(call => call.callStatus === 'Completed').length,
      averageCallDuration: leadCalls.length > 0
        ? Math.floor(leadCalls.reduce((sum, call) => sum + call.callDuration, 0) / leadCalls.length)
        : 0,
      callsByDay: leadCalls.reduce((acc, call) => {
        const date = new Date(call.timestamp).toISOString().split('T')[0]
        const existingDay = acc.find(day => day.date === date)

        if (existingDay) {
          existingDay.count++
        } else {
          acc.push({ date, count: 1 })
        }

        return acc
      }, [] as { date: string, count: number }[]),
      callsByType: [
        { type: 'Inbound', count: leadCalls.filter(call => call.callType === 'Inbound').length },
        { type: 'Outbound', count: leadCalls.filter(call => call.callType === 'Outbound').length }
      ],
      callsByStatus: [
        { status: 'Completed', count: leadCalls.filter(call => call.callStatus === 'Completed').length },
        { status: 'Missed', count: leadCalls.filter(call => call.callStatus === 'Missed').length },
        { status: 'Voicemail', count: leadCalls.filter(call => call.callStatus === 'Voicemail').length }
      ]
    }
  }
}