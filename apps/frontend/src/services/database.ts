/**
 * Database Service
 * 
 * This service handles all database operations using localStorage.
 * In a production environment, this would be replaced with a real database.
 */

import { Lead, Call, Interaction, CallAnalytics, LeadAnalytics } from '@/lib/dummy-data'

// Storage keys
const STORAGE_KEYS = {
  LEADS: 'eva_leads',
  CALLS: 'eva_calls',
  INTERACTIONS: 'eva_interactions'
}

// Database service
class DatabaseService {
  // Initialize the database
  initialize() {
    // Check if the database is already initialized
    if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
      // Initialize with empty arrays
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify([]))
      localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify([]))
      localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify([]))
    }
  }

  // Clear all data
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.LEADS)
    localStorage.removeItem(STORAGE_KEYS.CALLS)
    localStorage.removeItem(STORAGE_KEYS.INTERACTIONS)
    this.initialize()
  }

  // Leads
  getLeads(): Lead[] {
    const leads = localStorage.getItem(STORAGE_KEYS.LEADS)
    return leads ? JSON.parse(leads) : []
  }

  getLead(id: string): Lead | undefined {
    const leads = this.getLeads()
    return leads.find(lead => lead.id === id)
  }

  saveLead(lead: Lead): Lead {
    const leads = this.getLeads()
    const existingLeadIndex = leads.findIndex(l => l.id === lead.id)

    if (existingLeadIndex >= 0) {
      // Update existing lead
      leads[existingLeadIndex] = {
        ...leads[existingLeadIndex],
        ...lead,
        updatedAt: new Date().toISOString()
      }
    } else {
      // Add new lead
      leads.push({
        ...lead,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads))
    return lead
  }

  saveLeads(leads: Lead[]): Lead[] {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads))
    return leads
  }

  deleteLead(id: string): boolean {
    const leads = this.getLeads()
    const filteredLeads = leads.filter(lead => lead.id !== id)
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(filteredLeads))
    return true
  }

  // Calls
  getCalls(): Call[] {
    const calls = localStorage.getItem(STORAGE_KEYS.CALLS)
    return calls ? JSON.parse(calls) : []
  }

  getCall(id: string): Call | undefined {
    const calls = this.getCalls()
    return calls.find(call => call.id === id)
  }

  getCallsByLeadId(leadId: string): Call[] {
    const calls = this.getCalls()
    return calls.filter(call => call.leadId === leadId)
  }

  saveCall(call: Call): Call {
    const calls = this.getCalls()
    const existingCallIndex = calls.findIndex(c => c.id === call.id)

    if (existingCallIndex >= 0) {
      // Update existing call
      calls[existingCallIndex] = {
        ...calls[existingCallIndex],
        ...call
      }
    } else {
      // Add new call
      calls.push(call)
    }

    localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(calls))
    return call
  }

  saveCalls(calls: Call[]): Call[] {
    localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(calls))
    return calls
  }

  deleteCall(id: string): boolean {
    const calls = this.getCalls()
    const filteredCalls = calls.filter(call => call.id !== id)
    localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(filteredCalls))
    return true
  }

  // Interactions
  getInteractions(): Interaction[] {
    const interactions = localStorage.getItem(STORAGE_KEYS.INTERACTIONS)
    return interactions ? JSON.parse(interactions) : []
  }

  getInteractionsByLeadId(leadId: string): Interaction[] {
    const leads = this.getLeads()
    const lead = leads.find(lead => lead.id === leadId)
    return lead?.interactions || []
  }

  saveInteraction(leadId: string, interaction: Omit<Interaction, 'id'>): Interaction {
    const leads = this.getLeads()
    const leadIndex = leads.findIndex(lead => lead.id === leadId)

    if (leadIndex === -1) {
      throw new Error(`Lead with ID ${leadId} not found`)
    }

    // Create a new interaction with a unique ID
    const newInteraction: Interaction = {
      ...interaction,
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Add the interaction to the lead
    if (!leads[leadIndex].interactions) {
      leads[leadIndex].interactions = []
    }

    leads[leadIndex].interactions.push(newInteraction)
    leads[leadIndex].updatedAt = new Date().toISOString()

    // Update the lead's last contact date
    leads[leadIndex].lastContactDate = interaction.timestamp

    // Save the updated leads
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads))

    return newInteraction
  }

  // Analytics
  getCallAnalytics(): CallAnalytics {
    const calls = this.getCalls()

    // Calculate call analytics
    const totalCalls = calls.length
    const inboundCalls = calls.filter(call => call.callType === 'Inbound').length
    const outboundCalls = calls.filter(call => call.callType === 'Outbound').length
    const missedCalls = calls.filter(call => call.callStatus === 'Missed').length
    const completedCalls = calls.filter(call => call.callStatus === 'Completed').length
    
    // Calculate average call duration
    const averageCallDuration = calls.length > 0
      ? Math.floor(calls.reduce((sum, call) => sum + call.callDuration, 0) / calls.length)
      : 0

    // Group calls by day
    const callsByDay = calls.reduce((acc, call) => {
      const date = new Date(call.timestamp).toISOString().split('T')[0]
      const existingDay = acc.find(day => day.date === date)
      
      if (existingDay) {
        existingDay.count++
      } else {
        acc.push({ date, count: 1 })
      }
      
      return acc
    }, [] as { date: string, count: number }[])

    // Group calls by type
    const callsByType = [
      { type: 'Inbound', count: inboundCalls },
      { type: 'Outbound', count: outboundCalls }
    ]

    // Group calls by status
    const callsByStatus = [
      { status: 'Completed', count: completedCalls },
      { status: 'Missed', count: missedCalls },
      { status: 'Voicemail', count: calls.filter(call => call.callStatus === 'Voicemail').length }
    ]

    // Group calls by agent
    const callsByAgent = calls.reduce((acc, call) => {
      if (!call.agentName) return acc
      
      const existingAgent = acc.find(agent => agent.agent === call.agentName)
      
      if (existingAgent) {
        existingAgent.count++
      } else {
        acc.push({ agent: call.agentName, count: 1 })
      }
      
      return acc
    }, [] as { agent: string, count: number }[])

    return {
      totalCalls,
      inboundCalls,
      outboundCalls,
      missedCalls,
      completedCalls,
      averageCallDuration,
      callsByDay,
      callsByType,
      callsByStatus,
      callsByAgent
    }
  }

  getLeadAnalytics(): LeadAnalytics {
    const leads = this.getLeads()

    // Calculate lead analytics
    const totalLeads = leads.length
    
    // Calculate new leads today
    const today = new Date().toISOString().split('T')[0]
    const newLeadsToday = leads.filter(lead => 
      new Date(lead.createdAt).toISOString().split('T')[0] === today
    ).length

    // Calculate conversion rate (leads with status 'Interested' / total leads)
    const interestedLeads = leads.filter(lead => lead.status === 'Interested').length
    const leadsConversionRate = totalLeads > 0 
      ? Math.round((interestedLeads / totalLeads) * 100) 
      : 0

    // Group leads by status
    const leadsByStatus = leads.reduce((acc, lead) => {
      const existingStatus = acc.find(status => status.status === lead.status)
      
      if (existingStatus) {
        existingStatus.count++
      } else {
        acc.push({ status: lead.status, count: 1 })
      }
      
      return acc
    }, [] as { status: string, count: number }[])

    // Group leads by source
    const leadsBySource = leads.reduce((acc, lead) => {
      const existingSource = acc.find(source => source.source === lead.source)
      
      if (existingSource) {
        existingSource.count++
      } else {
        acc.push({ source: lead.source, count: 1 })
      }
      
      return acc
    }, [] as { source: string, count: number }[])

    // Group leads by property interest
    const leadsByInterest = leads.reduce((acc, lead) => {
      const existingInterest = acc.find(interest => interest.interest === lead.propertyInterest)
      
      if (existingInterest) {
        existingInterest.count++
      } else {
        acc.push({ interest: lead.propertyInterest, count: 1 })
      }
      
      return acc
    }, [] as { interest: string, count: number }[])

    // Group leads by location
    const leadsByLocation = leads.reduce((acc, lead) => {
      const existingLocation = acc.find(location => location.location === lead.location)
      
      if (existingLocation) {
        existingLocation.count++
      } else {
        acc.push({ location: lead.location, count: 1 })
      }
      
      return acc
    }, [] as { location: string, count: number }[])

    return {
      totalLeads,
      newLeadsToday,
      leadsConversionRate,
      leadsByStatus,
      leadsBySource,
      leadsByInterest,
      leadsByLocation
    }
  }
}

export const databaseService = new DatabaseService()
