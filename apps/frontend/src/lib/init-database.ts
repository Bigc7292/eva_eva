/**
 * Database Initialization Script
 * 
 * This script initializes the database with sample data.
 * It should be run once when the application starts.
 */

import { databaseService } from '@/services/database'
import { Lead, Call, Interaction } from '@/lib/dummy-data'

// Sample leads data
const sampleLeads: Lead[] = [
  {
    id: 'lead-1',
    crmId: 'CRM-1001',
    name: 'Ahmed Al Mansouri',
    phone: '+971 50 123 4567',
    email: 'ahmed@example.com',
    gender: 'Male',
    location: 'Dubai Marina',
    propertyInterest: 'Luxury Apartment',
    investmentType: 'Investment',
    budgetRange: '$1M - $2M',
    preferredAreas: ['Dubai Marina', 'Palm Jumeirah', 'Downtown Dubai'],
    status: 'Interested',
    priority: 'High',
    rating: 4,
    aiSentiment: 0.8,
    aiNotes: 'Very interested in luxury properties with sea view. Looking to invest within 3 months.',
    source: 'Website',
    notes: 'Prefers to be contacted in the evening.',
    createdAt: '2023-09-01T10:30:00.000Z',
    updatedAt: '2023-09-05T14:20:00.000Z',
    interactions: [],
    totalCalls: 2,
    lastContactDate: '2023-09-05T14:20:00.000Z',
    nextFollowUp: '2023-09-10T10:00:00.000Z',
    assignedAgent: 'Sarah Johnson'
  },
  {
    id: 'lead-2',
    crmId: 'CRM-1002',
    name: 'Fatima Al Zaabi',
    phone: '+971 55 987 6543',
    email: 'fatima@example.com',
    gender: 'Female',
    location: 'Jumeirah',
    propertyInterest: 'Villa',
    investmentType: 'Primary Residence',
    budgetRange: '$3M - $5M',
    preferredAreas: ['Jumeirah', 'Emirates Hills', 'Al Barari'],
    status: 'Callback',
    priority: 'Medium',
    rating: 3,
    aiSentiment: 0.6,
    aiNotes: 'Interested in family villas with garden. Needs more information on available options.',
    source: 'Referral',
    notes: 'Has 3 children, looking for a family-friendly area with good schools nearby.',
    createdAt: '2023-08-15T09:45:00.000Z',
    updatedAt: '2023-09-02T11:30:00.000Z',
    interactions: [],
    totalCalls: 1,
    lastContactDate: '2023-09-02T11:30:00.000Z',
    nextFollowUp: '2023-09-08T15:00:00.000Z',
    assignedAgent: 'Michael Brown'
  },
  {
    id: 'lead-3',
    crmId: 'CRM-1003',
    name: 'Raj Patel',
    phone: '+971 52 456 7890',
    email: 'raj@example.com',
    gender: 'Male',
    location: 'Business Bay',
    propertyInterest: 'Office Space',
    investmentType: 'Commercial',
    budgetRange: '$500K - $1M',
    preferredAreas: ['Business Bay', 'DIFC', 'Dubai Media City'],
    status: 'Interested',
    priority: 'High',
    rating: 5,
    aiSentiment: 0.9,
    aiNotes: 'Very interested in office space for his tech startup. Ready to move quickly.',
    source: 'Property Portal',
    notes: 'Currently renting, lease expires in 2 months.',
    createdAt: '2023-08-20T13:15:00.000Z',
    updatedAt: '2023-09-04T10:00:00.000Z',
    interactions: [],
    totalCalls: 3,
    lastContactDate: '2023-09-04T10:00:00.000Z',
    nextFollowUp: '2023-09-07T11:00:00.000Z',
    assignedAgent: 'Sarah Johnson'
  },
  {
    id: 'lead-4',
    crmId: 'CRM-1004',
    name: 'Elena Petrova',
    phone: '+971 54 789 0123',
    email: 'elena@example.com',
    gender: 'Female',
    location: 'Palm Jumeirah',
    propertyInterest: 'Penthouse',
    investmentType: 'Investment',
    budgetRange: '$5M+',
    preferredAreas: ['Palm Jumeirah', 'Bluewaters Island', 'Jumeirah Beach Residence'],
    status: 'Not Interested',
    priority: 'Low',
    rating: 2,
    aiSentiment: 0.3,
    aiNotes: 'Initially interested but found the prices too high. May reconsider in the future.',
    source: 'Social Media',
    notes: 'Looking for very high-end properties with full sea view.',
    createdAt: '2023-07-10T16:20:00.000Z',
    updatedAt: '2023-08-25T09:30:00.000Z',
    interactions: [],
    totalCalls: 1,
    lastContactDate: '2023-08-25T09:30:00.000Z',
    nextFollowUp: null,
    assignedAgent: 'Michael Brown'
  },
  {
    id: 'lead-5',
    crmId: 'CRM-1005',
    name: 'Li Wei',
    phone: '+971 56 234 5678',
    email: 'liwei@example.com',
    gender: 'Male',
    location: 'Downtown Dubai',
    propertyInterest: 'Apartment',
    investmentType: 'Investment',
    budgetRange: '$1M - $2M',
    preferredAreas: ['Downtown Dubai', 'Dubai Marina', 'City Walk'],
    status: 'Interested',
    priority: 'Medium',
    rating: 4,
    aiSentiment: 0.7,
    aiNotes: 'Looking for investment properties with good rental yield. Interested in off-plan options.',
    source: 'Website',
    notes: 'Based in China, prefers video calls due to time difference.',
    createdAt: '2023-08-05T08:10:00.000Z',
    updatedAt: '2023-09-01T15:45:00.000Z',
    interactions: [],
    totalCalls: 2,
    lastContactDate: '2023-09-01T15:45:00.000Z',
    nextFollowUp: '2023-09-12T09:00:00.000Z',
    assignedAgent: 'Sarah Johnson'
  }
];

// Sample calls data
const sampleCalls: Call[] = [
  {
    id: 'call-1',
    retellCallId: 'vg-1693555200000',
    timestamp: '2023-09-01T10:00:00.000Z',
    callDuration: 420, // 7 minutes
    callType: 'Outbound',
    callStatus: 'Completed',
    audioUrl: 'https://example.com/recordings/call-1.mp3',
    detailedCallSummary: 'Initial call with Ahmed to discuss luxury apartment options in Dubai Marina. He expressed strong interest in properties with sea view.',
    leadId: 'lead-1',
    leadName: 'Ahmed Al Mansouri',
    leadEmail: 'ahmed@example.com',
    leadPhone: '+971 50 123 4567',
    transcript: 'Agent: Hello, this is Sarah from Eva Real Estate. Am I speaking with Ahmed?\nAhmed: Yes, speaking.\nAgent: I\'m calling about your interest in luxury apartments in Dubai Marina. Is now a good time to talk?\nAhmed: Yes, I have a few minutes.\nAgent: Great! Based on your preferences, we have several options with sea views. What\'s your budget range?\nAhmed: I\'m looking in the $1M to $2M range.\nAgent: Perfect. We have 3 properties that match your criteria. Would you like to schedule a viewing?\nAhmed: Yes, that would be great.\nAgent: Excellent! How about this weekend?\nAhmed: Saturday morning works for me.\nAgent: Perfect, I\'ll send you the details by email. Thank you for your time!',
    sentimentScore: 0.8,
    keyTopics: ['Luxury Apartment', 'Sea View', 'Dubai Marina', 'Property Viewing'],
    nextSteps: 'Schedule property viewing for Saturday morning',
    agentId: 'agent-1',
    agentName: 'Sarah Johnson'
  },
  {
    id: 'call-2',
    retellCallId: 'vg-1693641600000',
    timestamp: '2023-09-02T11:30:00.000Z',
    callDuration: 360, // 6 minutes
    callType: 'Outbound',
    callStatus: 'Completed',
    audioUrl: 'https://example.com/recordings/call-2.mp3',
    detailedCallSummary: 'Follow-up call with Fatima to discuss villa options in Jumeirah. She requested more information about schools in the area.',
    leadId: 'lead-2',
    leadName: 'Fatima Al Zaabi',
    leadEmail: 'fatima@example.com',
    leadPhone: '+971 55 987 6543',
    transcript: 'Agent: Hello, this is Michael from Eva Real Estate. Am I speaking with Fatima?\nFatima: Yes, that\'s me.\nAgent: I\'m calling about your interest in villas in Jumeirah. Is now a good time to talk?\nFatima: Yes, I can talk now.\nAgent: Great! Based on your preferences, we have several family villas available. You mentioned you have children - how old are they?\nFatima: I have three children, ages 5, 8, and 10.\nAgent: In that case, you might be interested in properties near good schools. There are excellent schools in Jumeirah like Dubai College and Jumeirah English Speaking School.\nFatima: That sounds good. What about the villa sizes?\nAgent: We have 4-5 bedroom villas with gardens, perfect for families. Would you like me to send you some options?\nFatima: Yes, please email me the details.\nAgent: I\'ll do that right away. When would be a good time to follow up?\nFatima: Maybe next week?\nAgent: Perfect, I\'ll call you next week. Thank you!',
    sentimentScore: 0.7,
    keyTopics: ['Villa', 'Family-friendly', 'Schools', 'Jumeirah'],
    nextSteps: 'Send property options by email and follow up next week',
    agentId: 'agent-2',
    agentName: 'Michael Brown'
  },
  {
    id: 'call-3',
    retellCallId: 'vg-1693814400000',
    timestamp: '2023-09-04T10:00:00.000Z',
    callDuration: 480, // 8 minutes
    callType: 'Outbound',
    callStatus: 'Completed',
    audioUrl: 'https://example.com/recordings/call-3.mp3',
    detailedCallSummary: 'Call with Raj to discuss office space options in Business Bay. He is very interested and wants to view properties this week.',
    leadId: 'lead-3',
    leadName: 'Raj Patel',
    leadEmail: 'raj@example.com',
    leadPhone: '+971 52 456 7890',
    transcript: 'Agent: Hello, this is Sarah from Eva Real Estate. Am I speaking with Raj?\nRaj: Yes, speaking.\nAgent: I\'m calling about your interest in office space in Business Bay. Is now a good time to talk?\nRaj: Yes, I\'ve been waiting for your call.\nAgent: Great! Based on your requirements, we have several office spaces available in Business Bay. How many employees do you have?\nRaj: We\'re a team of 15 people, but planning to grow to 25 within a year.\nAgent: I see. We have spaces ranging from 1,500 to 2,500 square feet that would accommodate your team. What other facilities are important to you?\nRaj: We need good internet connectivity, meeting rooms, and preferably a space in a building with a gym.\nAgent: We have options that match all those criteria. When would you like to view the properties?\nRaj: As soon as possible. How about this Wednesday?\nAgent: Wednesday works perfectly. I\'ll send you the details and confirm the viewing appointment.\nRaj: Great, looking forward to it.',
    sentimentScore: 0.9,
    keyTopics: ['Office Space', 'Business Bay', 'Commercial Property', 'Property Viewing'],
    nextSteps: 'Schedule property viewing for Wednesday',
    agentId: 'agent-1',
    agentName: 'Sarah Johnson'
  },
  {
    id: 'call-4',
    retellCallId: 'vg-1692961200000',
    timestamp: '2023-08-25T09:30:00.000Z',
    callDuration: 300, // 5 minutes
    callType: 'Outbound',
    callStatus: 'Completed',
    audioUrl: 'https://example.com/recordings/call-4.mp3',
    detailedCallSummary: 'Call with Elena to discuss penthouse options in Palm Jumeirah. She found the prices too high and is not interested at the moment.',
    leadId: 'lead-4',
    leadName: 'Elena Petrova',
    leadEmail: 'elena@example.com',
    leadPhone: '+971 54 789 0123',
    transcript: 'Agent: Hello, this is Michael from Eva Real Estate. Am I speaking with Elena?\nElena: Yes, speaking.\nAgent: I\'m calling about your interest in penthouses in Palm Jumeirah. Is now a good time to talk?\nElena: Yes, I can talk.\nAgent: Great! We have several exclusive penthouses available with full sea views. Your budget was in the $5M+ range, correct?\nElena: Yes, but I\'ve been looking at properties and I think the prices in Palm Jumeirah are higher than I expected.\nAgent: I understand. The location does command premium prices. Would you be interested in other areas with similar luxury offerings but at a lower price point?\nElena: Not at the moment. I really had my heart set on Palm Jumeirah. I think I\'ll wait and see if the market changes.\nAgent: I completely understand. Would it be alright if I keep you updated on any special offers or price changes in the area?\nElena: Yes, that would be fine.\nAgent: Perfect. I\'ll make a note of that. Thank you for your time, Elena.',
    sentimentScore: 0.3,
    keyTopics: ['Penthouse', 'Palm Jumeirah', 'Price Concerns', 'Market Conditions'],
    nextSteps: 'Keep informed about price changes in Palm Jumeirah',
    agentId: 'agent-2',
    agentName: 'Michael Brown'
  },
  {
    id: 'call-5',
    retellCallId: 'vg-1693555200000',
    timestamp: '2023-09-01T15:45:00.000Z',
    callDuration: 390, // 6.5 minutes
    callType: 'Outbound',
    callStatus: 'Completed',
    audioUrl: 'https://example.com/recordings/call-5.mp3',
    detailedCallSummary: 'Video call with Li Wei to discuss investment properties in Downtown Dubai. He is interested in off-plan options with good rental yield.',
    leadId: 'lead-5',
    leadName: 'Li Wei',
    leadEmail: 'liwei@example.com',
    leadPhone: '+971 56 234 5678',
    transcript: 'Agent: Hello, this is Sarah from Eva Real Estate. Am I speaking with Li Wei?\nLi Wei: Yes, that\'s me.\nAgent: Thank you for joining this video call. I\'m calling about your interest in investment properties in Downtown Dubai. Is now a good time to talk?\nLi Wei: Yes, I\'m interested to hear about the options.\nAgent: Great! Based on your investment goals, we have several apartments in Downtown Dubai with expected rental yields of 6-8%. Are you more interested in ready properties or off-plan?\nLi Wei: I prefer off-plan as I\'m looking for long-term appreciation.\nAgent: Excellent choice. We have several off-plan projects in Downtown Dubai with completion dates in 2025. The payment plans are quite attractive, with only 20-30% due before completion.\nLi Wei: That sounds interesting. What about the developers? Are they reputable?\nAgent: Absolutely. These projects are by Emaar and Dubai Properties, two of the most established developers in Dubai.\nLi Wei: Good to know. Can you send me the details of these projects?\nAgent: Of course. I\'ll email you comprehensive information about each project, including floor plans, payment schedules, and projected ROI.\nLi Wei: Thank you. I\'ll review them and get back to you.\nAgent: Perfect. When would be a good time for a follow-up call?\nLi Wei: Perhaps next week, same time?\nAgent: That works perfectly. Thank you for your time!',
    sentimentScore: 0.7,
    keyTopics: ['Investment Property', 'Downtown Dubai', 'Off-plan', 'Rental Yield'],
    nextSteps: 'Send project details and follow up next week',
    agentId: 'agent-1',
    agentName: 'Sarah Johnson'
  }
];

// Sample interactions data
const sampleInteractions: Record<string, Interaction[]> = {
  'lead-1': [
    {
      id: 'interaction-1',
      type: 'Call',
      timestamp: '2023-09-01T10:00:00.000Z',
      details: 'Initial call to discuss luxury apartment options in Dubai Marina',
      duration: 420,
      outcome: 'Interested - Schedule Viewing',
      callId: 'call-1',
      audioUrl: 'https://example.com/recordings/call-1.mp3',
      transcript: 'Agent: Hello, this is Sarah from Eva Real Estate...'
    },
    {
      id: 'interaction-2',
      type: 'Email',
      timestamp: '2023-09-01T11:30:00.000Z',
      details: 'Sent property options and viewing schedule',
      outcome: 'Information Sent'
    },
    {
      id: 'interaction-3',
      type: 'Call',
      timestamp: '2023-09-05T14:20:00.000Z',
      details: 'Follow-up call to confirm property viewing',
      duration: 180,
      outcome: 'Confirmed Viewing',
      callId: 'call-6',
      audioUrl: 'https://example.com/recordings/call-6.mp3'
    }
  ],
  'lead-2': [
    {
      id: 'interaction-4',
      type: 'Call',
      timestamp: '2023-09-02T11:30:00.000Z',
      details: 'Call to discuss villa options in Jumeirah',
      duration: 360,
      outcome: 'Send Information',
      callId: 'call-2',
      audioUrl: 'https://example.com/recordings/call-2.mp3',
      transcript: 'Agent: Hello, this is Michael from Eva Real Estate...'
    },
    {
      id: 'interaction-5',
      type: 'Email',
      timestamp: '2023-09-02T13:00:00.000Z',
      details: 'Sent information about villas and nearby schools',
      outcome: 'Information Sent'
    }
  ],
  'lead-3': [
    {
      id: 'interaction-6',
      type: 'Call',
      timestamp: '2023-08-20T13:15:00.000Z',
      details: 'Initial call to understand requirements for office space',
      duration: 300,
      outcome: 'Interested - Send Options',
      callId: 'call-7',
      audioUrl: 'https://example.com/recordings/call-7.mp3'
    },
    {
      id: 'interaction-7',
      type: 'Email',
      timestamp: '2023-08-21T09:00:00.000Z',
      details: 'Sent office space options in Business Bay',
      outcome: 'Information Sent'
    },
    {
      id: 'interaction-8',
      type: 'Call',
      timestamp: '2023-08-25T16:30:00.000Z',
      details: 'Follow-up call to discuss sent options',
      duration: 240,
      outcome: 'Interested - Schedule Viewing',
      callId: 'call-8',
      audioUrl: 'https://example.com/recordings/call-8.mp3'
    },
    {
      id: 'interaction-9',
      type: 'Call',
      timestamp: '2023-09-04T10:00:00.000Z',
      details: 'Call to schedule property viewing',
      duration: 480,
      outcome: 'Viewing Scheduled',
      callId: 'call-3',
      audioUrl: 'https://example.com/recordings/call-3.mp3',
      transcript: 'Agent: Hello, this is Sarah from Eva Real Estate...'
    }
  ],
  'lead-4': [
    {
      id: 'interaction-10',
      type: 'Call',
      timestamp: '2023-08-25T09:30:00.000Z',
      details: 'Call to discuss penthouse options in Palm Jumeirah',
      duration: 300,
      outcome: 'Not Interested - Price',
      callId: 'call-4',
      audioUrl: 'https://example.com/recordings/call-4.mp3',
      transcript: 'Agent: Hello, this is Michael from Eva Real Estate...'
    }
  ],
  'lead-5': [
    {
      id: 'interaction-11',
      type: 'Email',
      timestamp: '2023-08-05T08:10:00.000Z',
      details: 'Received inquiry about investment properties in Downtown Dubai',
      outcome: 'New Lead'
    },
    {
      id: 'interaction-12',
      type: 'Call',
      timestamp: '2023-08-10T14:00:00.000Z',
      details: 'Initial call to discuss investment options',
      duration: 330,
      outcome: 'Interested - Send Options',
      callId: 'call-9',
      audioUrl: 'https://example.com/recordings/call-9.mp3'
    },
    {
      id: 'interaction-13',
      type: 'Call',
      timestamp: '2023-09-01T15:45:00.000Z',
      details: 'Video call to discuss off-plan projects',
      duration: 390,
      outcome: 'Interested - Send Details',
      callId: 'call-5',
      audioUrl: 'https://example.com/recordings/call-5.mp3',
      transcript: 'Agent: Hello, this is Sarah from Eva Real Estate...'
    }
  ]
};

// Initialize the database
export function initDatabase() {
  console.log('Initializing database with sample data...');
  
  // Clear existing data
  databaseService.clearAll();
  
  // Add interactions to leads
  const leadsWithInteractions = sampleLeads.map(lead => {
    return {
      ...lead,
      interactions: sampleInteractions[lead.id] || []
    };
  });
  
  // Save leads
  databaseService.saveLeads(leadsWithInteractions);
  
  // Save calls
  databaseService.saveCalls(sampleCalls);
  
  console.log('Database initialized with sample data.');
  
  return {
    leads: leadsWithInteractions,
    calls: sampleCalls
  };
}

// Export sample data for testing
export const sampleData = {
  leads: sampleLeads,
  calls: sampleCalls,
  interactions: sampleInteractions
};
