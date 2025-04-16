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

export interface Call {
  id: string;
  lead_id: string;
  lead_phone: string;
  lead_name?: string;
  call_type: 'Inbound' | 'Outbound';
  call_status: 'Completed' | 'Missed' | 'Voicemail' | 'In Progress' | 'Meeting Booked';
  audio_url?: string;
  transcript_url?: string;
  sentiment_score?: number;
  key_topics?: string[];
  next_steps?: string;
  agent_id?: string;
  agent_name?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
  call_duration?: number;
  cost?: number;
  meeting_scheduled?: boolean;
  meeting_time?: string;
  meeting_notes?: string;
  meeting_confirmed?: boolean;
  vapi_call_id?: string;
  vapi_transcript_id?: string;
  vapi_audio_id?: string;
  metadata?: Record<string, unknown>;
}
export interface LeadProfile {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  first_contact_date: string;
  last_contact_date: string;
  total_calls: number;
  successful_meetings: number;
  total_cost: number;
  cost_per_meeting: number;
  calls_to_meeting_ratio: number;
  average_sentiment: number;
  common_topics: string[];
  meeting_history: Array<{
    date: string;
    sentiment_score: number;
    topics: string[];
    duration: number;
  }>;
}

export interface VapiCallData {
  call_id: string;
  status: string;
  cost: number;
  duration: number;
  transcript: string;
  transcript_url: string;
  audio_url: string;
  sentiment: {
    score: number;
    topics: string[];
  };
}

export interface MeetingReminder {
  id: string;
  lead_id: string;
  meeting_time: string;
  reminder_type: 'email' | 'call' | 'in_app';
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  updated_at: string;
}