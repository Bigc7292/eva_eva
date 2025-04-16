export type Call = {
  id: string;
  call_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  customer_phone: string; // Changed from phone_number for compatibility
  call_duration?: number; // Changed from duration for compatibility
  recording_url?: string;
  agent_id?: string;
  agent_name?: string;
  created_at: string;
  updated_at: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  metadata?: any;
  // Additional fields for compatibility with call detail page
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  callType?: string;
  callStatus?: string;
  callDuration?: number;
  timestamp?: string;
  audioUrl?: string;
  transcript?: string;
  sentimentScore?: number;
  keyTopics?: string[];
  nextSteps?: string;
  agentName?: string;
  retellCallId?: string;
};
export type LeadProfile = {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  first_contact_date: string;
  last_contact_date: string;
  total_calls: number;
  successful_meetings: number;
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
  successfulCalls: number;
  missedCalls: number;
  averageCallDuration: number;
  calls: Call[];
};
