// Dummy data for the CRM system

export interface Lead {
  id: string;
  crmId: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  location: string;
  propertyInterest: string;
  investmentType: string;
  budgetRange: string;
  preferredAreas: string[];
  status: 'Interested' | 'Not Interested' | 'Callback' | 'No Answer';
  priority: 'High' | 'Medium' | 'Low';
  rating: number;
  aiSentiment: number;
  aiNotes: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields
  interactions: Interaction[];
  totalCalls: number;
  lastContactDate: string;
  nextFollowUp: string | null;
  assignedAgent: string | null;
}

export interface Call {
  id: string;
  retellCallId: string;
  timestamp: string;
  callDuration: number;
  callType: 'Inbound' | 'Outbound';
  callStatus: 'Completed' | 'Missed' | 'Voicemail';
  audioUrl: string;
  detailedCallSummary: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  // Additional fields
  transcript: string | null;
  sentimentScore: number;
  keyTopics: string[];
  nextSteps: string | null;
  agentId: string | null;
  agentName: string | null;
}

export interface CallAnalytics {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  completedCalls: number;
  averageCallDuration: number;
  callsByDay: { date: string; count: number }[];
  callsByType: { type: string; count: number }[];
  callsByStatus: { status: string; count: number }[];
  callsByAgent: { agent: string; count: number }[];
}

export interface LeadAnalytics {
  totalLeads: number;
  newLeadsToday: number;
  leadsConversionRate: number;
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  leadsByInterest: { interest: string; count: number }[];
  leadsByLocation: { location: string; count: number }[];
}

// Define interaction interface
export interface Interaction {
  id: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note';
  timestamp: string;
  details: string;
  duration?: number;
  outcome?: string;
  callId?: string;
  audioUrl?: string;
  transcript?: string;
}

// Helper function for random date generation
const randomDateString = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
};

// Generate dummy leads
export const dummyLeads: Lead[] = Array.from({ length: 50 }, (_, i) => {
  const statuses = ['Interested', 'Not Interested', 'Callback', 'No Answer'];
  const priorities = ['High', 'Medium', 'Low'];
  const sources = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Property Portal'];
  const propertyInterests = ['Off-plan', 'Ready', 'Secondary', 'Commercial'];
  const investmentTypes = ['Investment', 'Personal Use', 'Both'];
  const budgetRanges = ['1M-2M AED', '2M-5M AED', '5M-10M AED', '10M+ AED'];
  const locations = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'];
  const areas = [
    'Dubai Marina',
    'Palm Jumeirah',
    'Downtown Dubai',
    'JVC',
    'Arabian Ranches',
    'Dubai Hills',
    'Business Bay',
    'JLT',
    'Dubai South'
  ];

  const createdAt = randomDateString(new Date(2023, 0, 1), new Date());
  const updatedAt = randomDateString(new Date(new Date(createdAt)), new Date());

  const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
  const rating = Math.floor(Math.random() * 6);
  const aiSentiment = parseFloat((Math.random()).toFixed(2));

  // Generate random interactions
  const numInteractions = Math.floor(Math.random() * 5) + 1;
  const interactions: Interaction[] = Array.from({ length: numInteractions }, (_, j) => {
    const interactionTypes = ['Call', 'Email', 'Meeting', 'Note'];
    const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)] as 'Call' | 'Email' | 'Meeting' | 'Note';
    const timestamp = randomDateString(new Date(2023, 0, 1), new Date());

    return {
      id: `interaction-${i}-${j}`,
      type,
      timestamp,
      details: type === 'Call'
        ? `${type === 'Inbound' ? 'Received' : 'Made'} a call regarding ${propertyInterests[Math.floor(Math.random() * propertyInterests.length)]} properties`
        : type === 'Email'
        ? `Sent information about ${areas[Math.floor(Math.random() * areas.length)]} properties`
        : type === 'Meeting'
        ? `Met to discuss ${investmentTypes[Math.floor(Math.random() * investmentTypes.length)]} options`
        : `Added note about client preferences`,
      duration: type === 'Call' ? Math.floor(Math.random() * 600) + 30 : type === 'Meeting' ? Math.floor(Math.random() * 3600) + 900 : undefined,
      outcome: Math.random() > 0.5 ? 'Positive' : Math.random() > 0.3 ? 'Neutral' : 'Needs Follow-up',
      callId: type === 'Call' ? `call-${Math.floor(Math.random() * 1000)}` : undefined,
      audioUrl: type === 'Call' ? `https://example.com/recordings/call-${Math.floor(Math.random() * 1000)}.mp3` : undefined,
      transcript: type === 'Call' ? `Client expressed interest in ${propertyInterests[Math.floor(Math.random() * propertyInterests.length)]} properties in ${areas[Math.floor(Math.random() * areas.length)]}.` : undefined
    };
  });

  return {
    id: `lead-${i + 1}`,
    crmId: `CRM-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    name: `Client ${i + 1}`,
    phone: `+971 5${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    email: `client${i + 1}@example.com`,
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    location: locations[Math.floor(Math.random() * locations.length)],
    propertyInterest: propertyInterests[Math.floor(Math.random() * propertyInterests.length)],
    investmentType: investmentTypes[Math.floor(Math.random() * investmentTypes.length)],
    budgetRange: budgetRanges[Math.floor(Math.random() * budgetRanges.length)],
    preferredAreas: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
      areas[Math.floor(Math.random() * areas.length)]
    ),
    status,
    priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
    rating,
    aiSentiment,
    aiNotes: `AI analysis indicates ${aiSentiment > 0.7 ? 'strong' : aiSentiment > 0.4 ? 'moderate' : 'low'} interest.`,
    source: sources[Math.floor(Math.random() * sources.length)],
    notes: `Follow up with client regarding ${propertyInterests[Math.floor(Math.random() * propertyInterests.length)]} properties.`,
    createdAt,
    updatedAt,
    interactions,
    totalCalls: interactions.filter(i => i.type === 'Call').length,
    lastContactDate: [...interactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp,
    nextFollowUp: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString() : null,
    assignedAgent: Math.random() > 0.3 ? ['Sarah Johnson', 'Michael Chen', 'Aisha Patel', 'David Kim'][Math.floor(Math.random() * 4)] : null
  };
});

// Generate dummy calls
export const dummyCalls: Call[] = Array.from({ length: 100 }, (_, i) => {
  const callTypes = ['Inbound', 'Outbound'];
  const callStatuses = ['Completed', 'Missed', 'Voicemail'];
  const callType = callTypes[Math.floor(Math.random() * callTypes.length)] as any;
  const callStatus = callStatuses[Math.floor(Math.random() * callStatuses.length)] as any;
  const callDuration = callStatus === 'Completed' ? Math.floor(Math.random() * 600) + 30 : 0;

  const timestamp = randomDateString(new Date(2023, 0, 1), new Date());
  const leadIndex = Math.floor(Math.random() * dummyLeads.length);
  const lead = dummyLeads[leadIndex];

  // Generate random transcript and sentiment
  const transcript = callStatus === 'Completed'
    ? `Agent: Hello, this is ${['Sarah', 'Michael', 'Aisha', 'David'][Math.floor(Math.random() * 4)]} from Eva Real Estate. How can I help you today?\n` +
      `Client: Hi, I'm interested in ${lead.propertyInterest} properties in ${lead.preferredAreas.join(', ')}.\n` +
      `Agent: Great! We have several options that might suit your needs. Could you tell me more about your budget range?\n` +
      `Client: I'm looking in the ${lead.budgetRange} range.\n` +
      `Agent: Perfect. And are you looking for investment or personal use?\n` +
      `Client: ${lead.investmentType}.\n` +
      `Agent: I'll send you some options that match your criteria. When would be a good time to follow up?\n` +
      `Client: You can call me next week.\n` +
      `Agent: Great, I'll schedule that. Thank you for your time!`
    : null;

  const sentimentScore = Math.random();
  const keyTopics = [
    lead.propertyInterest,
    lead.investmentType,
    lead.budgetRange,
    ...lead.preferredAreas.slice(0, 2)
  ];

  return {
    id: `call-${i + 1}`,
    retellCallId: `retell-${Math.floor(Math.random() * 1000000)}`,
    timestamp,
    callDuration,
    callType,
    callStatus,
    audioUrl: `https://example.com/recordings/call-${i + 1}.mp3`,
    detailedCallSummary: `Call with ${lead.name} regarding ${lead.propertyInterest} properties in ${lead.preferredAreas.join(', ')}. ${
      callStatus === 'Completed'
        ? `Discussed ${lead.budgetRange} budget range and preferences. Client expressed ${lead.status === 'Interested' ? 'strong' : 'some'} interest.`
        : callStatus === 'Missed'
          ? 'Call was missed and needs follow-up.'
          : 'Left voicemail requesting callback.'
    }`,
    leadId: lead.id,
    leadName: lead.name,
    leadEmail: lead.email,
    leadPhone: lead.phone,
    transcript,
    sentimentScore,
    keyTopics,
    nextSteps: Math.random() > 0.4 ? 'Schedule property viewing' : Math.random() > 0.5 ? 'Send property options' : 'Follow up in one week',
    agentId: Math.random() > 0.3 ? `agent-${Math.floor(Math.random() * 4) + 1}` : null,
    agentName: Math.random() > 0.3 ? ['Sarah Johnson', 'Michael Chen', 'Aisha Patel', 'David Kim'][Math.floor(Math.random() * 4)] : null
  };
});

// Generate call analytics
export const dummyCallAnalytics: CallAnalytics = {
  totalCalls: dummyCalls.length,
  inboundCalls: dummyCalls.filter(call => call.callType === 'Inbound').length,
  outboundCalls: dummyCalls.filter(call => call.callType === 'Outbound').length,
  missedCalls: dummyCalls.filter(call => call.callStatus === 'Missed').length,
  completedCalls: dummyCalls.filter(call => call.callStatus === 'Completed').length,
  averageCallDuration: Math.floor(
    dummyCalls
      .filter(call => call.callStatus === 'Completed')
      .reduce((sum, call) => sum + call.callDuration, 0) /
    dummyCalls.filter(call => call.callStatus === 'Completed').length
  ),
  callsByDay: Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    return {
      date: dateString,
      count: Math.floor(Math.random() * 20) + 5
    };
  }).reverse(),
  callsByType: [
    { type: 'Inbound', count: dummyCalls.filter(call => call.callType === 'Inbound').length },
    { type: 'Outbound', count: dummyCalls.filter(call => call.callType === 'Outbound').length }
  ],
  callsByStatus: [
    { status: 'Completed', count: dummyCalls.filter(call => call.callStatus === 'Completed').length },
    { status: 'Missed', count: dummyCalls.filter(call => call.callStatus === 'Missed').length },
    { status: 'Voicemail', count: dummyCalls.filter(call => call.callStatus === 'Voicemail').length }
  ],
  callsByAgent: [
    { agent: 'Agent 1', count: Math.floor(Math.random() * 30) + 10 },
    { agent: 'Agent 2', count: Math.floor(Math.random() * 30) + 10 },
    { agent: 'Agent 3', count: Math.floor(Math.random() * 30) + 10 },
    { agent: 'Agent 4', count: Math.floor(Math.random() * 30) + 10 }
  ]
};

// Generate lead analytics
export const dummyLeadAnalytics: LeadAnalytics = {
  totalLeads: dummyLeads.length,
  newLeadsToday: Math.floor(Math.random() * 10) + 1,
  leadsConversionRate: parseFloat((Math.random() * 0.3 + 0.1).toFixed(2)),
  leadsByStatus: [
    { status: 'Interested', count: dummyLeads.filter(lead => lead.status === 'Interested').length },
    { status: 'Not Interested', count: dummyLeads.filter(lead => lead.status === 'Not Interested').length },
    { status: 'Callback', count: dummyLeads.filter(lead => lead.status === 'Callback').length },
    { status: 'No Answer', count: dummyLeads.filter(lead => lead.status === 'No Answer').length }
  ],
  leadsBySource: [
    { source: 'Website', count: dummyLeads.filter(lead => lead.source === 'Website').length },
    { source: 'Referral', count: dummyLeads.filter(lead => lead.source === 'Referral').length },
    { source: 'Cold Call', count: dummyLeads.filter(lead => lead.source === 'Cold Call').length },
    { source: 'Social Media', count: dummyLeads.filter(lead => lead.source === 'Social Media').length },
    { source: 'Property Portal', count: dummyLeads.filter(lead => lead.source === 'Property Portal').length }
  ],
  leadsByInterest: [
    { interest: 'Off-plan', count: dummyLeads.filter(lead => lead.propertyInterest === 'Off-plan').length },
    { interest: 'Ready', count: dummyLeads.filter(lead => lead.propertyInterest === 'Ready').length },
    { interest: 'Secondary', count: dummyLeads.filter(lead => lead.propertyInterest === 'Secondary').length },
    { interest: 'Commercial', count: dummyLeads.filter(lead => lead.propertyInterest === 'Commercial').length }
  ],
  leadsByLocation: [
    { location: 'Dubai', count: dummyLeads.filter(lead => lead.location === 'Dubai').length },
    { location: 'Abu Dhabi', count: dummyLeads.filter(lead => lead.location === 'Abu Dhabi').length },
    { location: 'Sharjah', count: dummyLeads.filter(lead => lead.location === 'Sharjah').length },
    { location: 'Ajman', count: dummyLeads.filter(lead => lead.location === 'Ajman').length },
    { location: 'Ras Al Khaimah', count: dummyLeads.filter(lead => lead.location === 'Ras Al Khaimah').length }
  ]
};
