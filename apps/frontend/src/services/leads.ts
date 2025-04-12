import type { CrmStatus } from '@/types'
import { dummyLeads, Lead, Interaction, Call, dummyCalls } from '@/lib/dummy-data'

export const leadsService = {
  async getLeads() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return dummyLeads
  },

  async searchLeads(query: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    const lowerQuery = query.toLowerCase()
    return dummyLeads.filter(lead =>
      lead.name.toLowerCase().includes(lowerQuery) ||
      lead.email.toLowerCase().includes(lowerQuery) ||
      lead.phone.includes(query) ||
      lead.crmId.toLowerCase().includes(lowerQuery)
    )
  },

  async getLead(id: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    return dummyLeads.find(lead => lead.id === id)
  },

  async getLeadInteractions(leadId: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 400))
    const lead = dummyLeads.find(lead => lead.id === leadId)
    return lead?.interactions || []
  },

  async updateLeadStatus(leadId: string, status: CrmStatus) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log(`Updated lead ${leadId} status to ${status}`)
    return true
  },

  async updateLeadDetails(leadId: string, details: Partial<Lead>) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 400))
    console.log(`Updated lead ${leadId} details:`, details)
    return true
  },

  async addLeadInteraction(leadId: string, interaction: Omit<Interaction, 'id'>) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    const interactionId = `interaction-${Date.now()}`
    console.log(`Added interaction ${interactionId} to lead ${leadId}:`, interaction)
    return { ...interaction, id: interactionId }
  },

  async initiateCall(leadId: string) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Get lead details
      const lead = dummyLeads.find(lead => lead.id === leadId)
      if (!lead) throw new Error('Lead not found')

      // Simulate making a call
      const callId = `call-${Date.now()}`
      console.log(`Initiated call to ${lead.phone} with ID ${callId}`)

      // Add interaction
      const now = new Date().toISOString()
      const interaction: Omit<Interaction, 'id'> = {
        type: 'Call',
        timestamp: now,
        details: `Made an outbound call to ${lead.phone}`,
        duration: Math.floor(Math.random() * 300) + 60,
        outcome: 'Needs Follow-up',
        callId,
        audioUrl: `https://example.com/recordings/${callId}.mp3`,
        transcript: `Agent: Hello, this is an agent from Eva Real Estate. Is this ${lead.name}?\nClient: Yes, speaking.\nAgent: I'm calling about your interest in ${lead.propertyInterest} properties...`
      }

      await this.addLeadInteraction(leadId, interaction)

      return callId
    } catch (error) {
      console.error('Error initiating call:', error)
      throw error
    }
  },

  async scheduleFollowUp(leadId: string, date: Date) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log(`Scheduled follow-up for lead ${leadId} on ${date.toISOString()}`)
    return true
  },

  async assignLeadToAgent(leadId: string, agentId: string, agentName: string) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log(`Assigned lead ${leadId} to agent ${agentName} (${agentId})`)
    return true
  }
}