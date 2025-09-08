import { supabase } from '@/lib/services/supabase';

// Define types for our analytics data
interface Call {
  call_id: string;
  phone_number: string;
  call_type: string;
  call_status: string;
  start_time: string;
  end_time?: string;
  call_duration?: number;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  meeting_scheduled?: boolean;
  meeting_time?: string;
  agent_id?: string;
  agent_name?: string;
  status?: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  source?: string;
  location?: string;
  successful_meetings?: number;
  created_at?: string;
  updated_at?: string;
}

interface CallAnalytics {
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
  callsByType: Array<{type: string; count: number}>;
  callsByStatus: Array<{status: string; count: number}>;
  callsByDay: Array<{date: string; calls: number}>;
  recentCalls: Call[];
}

interface MeetingAnalytics {
  totalMeetings: number;
  offplanMeetings: number;
  secondaryMeetings: number;
  costPerMeeting: number;
  totalCost: number;
  meetingsByPropertyType: Array<{name: string; value: number}>;
}

interface LeadAnalytics {
  totalLeads: number;
  newLeadsToday: number;
  leadsConversionRate: number;
  leadsByStatus: Array<{status: string; count: number}>;
  leadsBySource: Array<{source: string; count: number}>;
  leadsByLocation: Array<{location: string; count: number}>;
}

export class AnalyticsError extends Error {
  details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'AnalyticsError';
    this.details = details;
  }
}

export async function getCallAnalytics(): Promise<CallAnalytics> {
  try {
    // Fetch analytics data from the API
    const response = await fetch('/api/analytics');

    if (!response.ok) {
      throw new AnalyticsError('Failed to fetch analytics data');
    }

    const analyticsData = await response.json();

    // Fetch calls data for detailed information
    const callsResponse = await fetch('/api/calls');

    if (!callsResponse.ok) {
      throw new AnalyticsError('Failed to fetch calls data');
    }

    const calls = await callsResponse.json();

    // Return combined data
    return {
      ...analyticsData,
      calls: calls || [],
      callsByType: groupCallsByType(calls),
      callsByStatus: groupCallsByStatus(calls),
      recentCalls: calls?.slice(0, 10) || []
    };
  } catch (error) {
    console.error('Error in getCallAnalytics:', error);
    throw error;
  }
}

export async function getMeetingAnalytics(): Promise<MeetingAnalytics> {
  try {
    // Fetch calls data to analyze meetings
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('meeting_scheduled', true);

    if (error) {
      console.error('Error fetching meeting data:', error);
      // Return default values instead of throwing an error
      return {
        totalMeetings: 0,
        offplanMeetings: 0,
        secondaryMeetings: 0,
        costPerMeeting: 0,
        totalCost: 0,
        meetingsByPropertyType: [
          { name: 'Offplan', value: 0 },
          { name: 'Secondary', value: 0 }
        ]
      };
    }

    // Calculate meeting metrics
    const totalMeetings = calls?.length || 0;

    // Count property types (using metadata or other fields)
    // Safely check if metadata exists and is an object before accessing properties
    const offplanMeetings = calls?.filter(call => {
      const metadata = call.metadata || {};
      const summary = call.summary || '';
      const transcript = call.transcript || '';

      return (
        (typeof metadata === 'object' && metadata?.property_type === 'offplan') ||
        summary.toLowerCase().includes('offplan') ||
        transcript.toLowerCase().includes('off plan') ||
        transcript.toLowerCase().includes('offplan')
      );
    }).length || 0;

    const secondaryMeetings = totalMeetings - offplanMeetings;

    // Calculate costs based on actual call data
    const avgCallDuration = calls?.reduce((sum, call) => sum + (call.call_duration || 0), 0) / (totalMeetings || 1);

    // Use actual cost data if available, otherwise calculate based on duration
    // Cost is calculated at $0.15 per minute of call time
    const costPerMinute = 0.15;
    const costPerMeeting = avgCallDuration ? (avgCallDuration / 60) * costPerMinute : 0;
    const totalCost = costPerMeeting * totalMeetings;

    return {
      totalMeetings,
      offplanMeetings,
      secondaryMeetings,
      costPerMeeting,
      totalCost,
      meetingsByPropertyType: [
        { name: 'Offplan', value: offplanMeetings },
        { name: 'Secondary', value: secondaryMeetings }
      ],
      // Add more metrics as needed
    };
  } catch (error) {
    console.error('Error in getMeetingAnalytics:', error);
    throw error;
  }
}

export async function getLeadAnalytics(): Promise<LeadAnalytics> {
  try {
    // Fetch analytics data from the API
    const response = await fetch('/api/analytics');

    if (!response.ok) {
      throw new AnalyticsError('Failed to fetch analytics data');
    }

    const analyticsData = await response.json();

    // Return lead-related data
    return {
      totalLeads: analyticsData.totalLeads || 0,
      newLeadsToday: analyticsData.newLeadsToday || 0,
      leadsConversionRate: analyticsData.leadsConversionRate || 0,
      leadsByStatus: analyticsData.leadsByStatus || [],
      leadsBySource: analyticsData.leadsBySource || [],
      leadsByLocation: analyticsData.leadsByLocation || []
    };
  } catch (error) {
    console.error('Error in getLeadAnalytics:', error);
    throw error;
  }
}

function groupCallsByDay(calls: Call[]): Array<{date: string; calls: number}> {
  const grouped = calls.reduce<Record<string, number>>((acc, call) => {
    const date = new Date(call.start_time).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    calls: count
  }));
}

function groupCallsByType(calls: Call[]): Array<{type: string; count: number}> {
  return Object.entries(
    calls.reduce<Record<string, number>>((acc, call) => {
      acc[call.call_type] = (acc[call.call_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({ type, count }));
}

function groupCallsByStatus(calls: Call[]): Array<{status: string; count: number}> {
  return Object.entries(
    calls.reduce<Record<string, number>>((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));
}

async function groupCallsByAgent(calls: Call[]): Promise<Array<{agent: string; count: number}>> {
  try {
    // Get unique agent names from calls instead of users table
    const agentMap = new Map(calls
      .filter(call => call.agent_id && call.agent_name)
      .map(call => [call.agent_id, call.agent_name]) as [string, string][]);

    return Object.entries(
      calls.reduce<Record<string, number>>((acc, call) => {
        const agentName = call.agent_name || 'Unassigned';
        acc[agentName] = (acc[agentName] || 0) + 1;
        return acc;
      }, {})
    ).map(([agent, count]) => ({ agent, count }));
  } catch (error) {
    console.error('Error in groupCallsByAgent:', error);
    throw error;
  }
}

function calculateConversionRate(leads: Lead[]): number {
  const converted = leads.filter(lead => lead.successful_meetings > 0).length;
  return leads.length > 0 ? (converted / leads.length) * 100 : 0;
}

function groupLeadsByStatus(leads: Lead[]): Array<{status: string; count: number}> {
  return Object.entries(
    leads.reduce<Record<string, number>>((acc, lead) => {
      const status = lead.successful_meetings > 0 ? 'Converted' : 'Active';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));
}

function groupLeadsBySource(leads: Lead[]): Array<{source: string; count: number}> {
  return Object.entries(
    leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.source || 'Unknown'] = (acc[lead.source || 'Unknown'] || 0) + 1;
      return acc;
    }, {})
  ).map(([source, count]) => ({ source, count }));
}

function groupLeadsByLocation(leads: Lead[]): Array<{location: string; count: number}> {
  return Object.entries(
    leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.location || 'Unknown'] = (acc[lead.location || 'Unknown'] || 0) + 1;
      return acc;
    }, {})
  ).map(([location, count]) => ({ location, count }));
}