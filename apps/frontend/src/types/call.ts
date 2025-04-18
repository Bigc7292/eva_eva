export type Call = {
  id: string;
  call_id: string;
  lead_id: string;
  phone_number: string;
  call_type: string;
  call_status: string;
  call_outcome?: string;
  timestamp: string;
  end_time?: string;
  call_duration?: number;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  meeting_scheduled?: boolean;
  meeting_time?: string;
  callback_scheduled?: boolean;
  callback_time?: string;
  created_at: string;
  updated_at: string;
  // biome-ignore lint/suspicious/noExplicitAny: metadata can have various structures
  metadata?: any;

  // Compatibility fields for UI components
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  callType?: string;
  callStatus?: string;
  callDuration?: number;
  audioUrl?: string;
  sentimentScore?: number;
  keyTopics?: string[];
  nextSteps?: string;
  agentName?: string;
  retellCallId?: string;
};
export type LeadProfile = {
  id: string;
  lead_id: string;
  phone: string;
  first_contact_date: string;
  successful_meetings: number;
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  last_call_date?: string;
  last_call_status?: string;
  callback_date?: string;
  interest_level?: string;
  created_at: string;
  updated_at: string;
}

export interface VapiCallData {
  vapi_call_id?: string;
  vapi_transcript_id?: string;
  vapi_audio_id?: string;
  cost?: number;
  meeting_scheduled?: boolean;
  meeting_time?: string;
  meeting_notes?: string;
  meeting_confirmed?: boolean;
}

export interface CallAnalytics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  voicemailCalls: number;
  failedCalls: number;
  answerRate: number;
  averageCallDuration: number;
  meetingsScheduled: number;
  callbacksScheduled: number;
  calls: Call[];
  callsByDate?: { date: string; count: number }[];
  callsByStatus?: { status: string; count: number }[];
  callsByOutcome?: { outcome: string; count: number }[];
};
