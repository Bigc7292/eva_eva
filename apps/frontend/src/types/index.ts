export type CrmStatus = 'New' | 'Follow-up' | 'Interested' | 'Not Interested' | 'No Answer' | 'Callback'

export type PropertyInterest = 'Off-plan' | 'Secondary' | 'Both' | 'Unknown'

export interface BaseLead {
  id: string
  crmId: string
  name: string
  email: string
  phone: string
  timestamp: string
  propertyInterest: PropertyInterest
  status: CrmStatus
  rating: number
  notes?: string
}

export interface Lead {
  id: string
  crmId: string
  name: string
  phone: string
  email: string
  propertyInterest: string
  rating: number
  status: 'new' | 'contacted' | 'interested' | 'not-interested' | 'callback'
  createdAt: Date
  updatedAt: Date
}

export interface InboundCall extends BaseLead {
  callDuration: string
  callType: 'Inbound'
  callStatus: 'Completed' | 'Missed' | 'Voicemail'
  audioUrl: string | null
}

export interface OutboundCall extends BaseLead {
  callDuration: string
  callType: 'Outbound'
  callStatus: 'Completed' | 'No Answer' | 'Busy' | 'Rejected'
  audioUrl: string | null
  callbackScheduled?: string
}

export interface Callback extends BaseLead {
  scheduledTime: string
  priority: 'High' | 'Medium' | 'Low'
  attempts: number
  lastAttempt?: string
}

export interface NotInterested extends BaseLead {
  reason: string
  followUpDate?: string
  potentialFuture: boolean
}

export interface NoAnswer extends BaseLead {
  attempts: number
  lastAttempt: string
  nextAttempt?: string
} 