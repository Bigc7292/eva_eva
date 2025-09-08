// Re-export dummy data from utils
import { dummyLeads, dummyCallStats, dummyCallHistory } from '@/utils/dummyData';

// Define types for the dummy data
export interface Lead {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  status: string;
  interest: string;
  budget: string;
  location: string;
  nationality: string;
  gender: string;
  callRating: number;
  notes: string;
  crmId?: string;
  interactions?: Interaction[];
  aiSentiment?: number;
  aiNotes?: string;
}

export interface Call {
  id: string;
  lead_id?: string;
  lead_phone?: string;
  lead_name?: string;
  call_type: 'Inbound' | 'Outbound';
  call_status: 'Completed' | 'Missed' | 'Voicemail' | 'In Progress';
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
}

export interface Interaction {
  id: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note';
  timestamp: string;
  details: string;
  agent?: string;
  duration?: number;
  outcome?: string;
}

// Create dummy calls data
export const dummyCalls: Call[] = [
  {
    id: 'call-1',
    lead_id: '1',
    lead_phone: '+971 50 123 4567',
    lead_name: 'John Smith',
    call_type: 'Outbound',
    call_status: 'Completed',
    audio_url: 'https://example.com/audio/call-1.mp3',
    transcript_url: 'https://example.com/transcript/call-1.txt',
    sentiment_score: 0.85,
    key_topics: ['Off-plan', 'Dubai Marina', 'Investment'],
    next_steps: 'Send property details',
    agent_id: 'agent-1',
    agent_name: 'Sarah Johnson',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    call_duration: 325
  },
  {
    id: 'call-2',
    lead_id: '2',
    lead_phone: '+1 212 555 1234',
    lead_name: 'Jane Doe',
    call_type: 'Inbound',
    call_status: 'Completed',
    audio_url: 'https://example.com/audio/call-2.mp3',
    transcript_url: 'https://example.com/transcript/call-2.txt',
    sentiment_score: 0.92,
    key_topics: ['Penthouse', 'Downtown', 'Financing'],
    next_steps: 'Schedule property viewing',
    agent_id: 'agent-2',
    agent_name: 'Michael Chen',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    call_duration: 412
  },
  {
    id: 'call-3',
    lead_id: '3',
    lead_phone: '+44 20 7123 4567',
    lead_name: 'Peter Jones',
    call_type: 'Outbound',
    call_status: 'Missed',
    agent_id: 'agent-1',
    agent_name: 'Sarah Johnson',
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    call_duration: 0
  }
];

// Add interactions to the leads
const enhancedDummyLeads = dummyLeads.map((lead, index) => {
  // Convert id to string if it's a number
  const leadId = typeof lead.id === 'number' ? lead.id.toString() : lead.id;
  
  // Add a crmId field
  const crmId = `CRM-${leadId.padStart(4, '0')}`;
  
  // Create some interactions
  const interactions: Interaction[] = [
    {
      id: `interaction-${leadId}-1`,
      type: 'Call',
      timestamp: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
      details: 'Initial contact call',
      agent: 'Sarah Johnson',
      duration: 325,
      outcome: 'Interested'
    },
    {
      id: `interaction-${leadId}-2`,
      type: 'Email',
      timestamp: new Date(Date.now() - (index + 1) * 86400000 + 3600000).toISOString(),
      details: 'Sent property details',
      agent: 'Sarah Johnson'
    }
  ];
  
  // Add AI sentiment and notes for some leads
  const aiSentiment = Math.random() * 0.5 + 0.5; // Random between 0.5 and 1.0
  const aiNotes = 'AI analysis indicates strong interest in property investment. Follow up recommended.';
  
  return {
    ...lead,
    crmId,
    interactions,
    aiSentiment,
    aiNotes
  };
});

export { enhancedDummyLeads as dummyLeads };
