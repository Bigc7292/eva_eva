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
  total_meetings: number;
  completed_meetings: number;
  cancelled_meetings: number;
  scheduled_meetings: number;
  locations: Array<{location: string; count: number}>;
  types: Array<{type: string; count: number}>;
  avg_cost_per_meeting: number;
  total_cost: number;
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
    // Fetch meeting metrics from the API
    const response = await fetch('/api/metrics/meetings');

    if (!response.ok) {
      throw new AnalyticsError('Failed to fetch meeting metrics');
    }

    const meetingData = await response.json();

    // Fetch cost data
    const costResponse = await fetch('/api/metrics/costs');
    let costData = { avg_cost_per_meeting: 0, total_cost: 0 };

    if (costResponse.ok) {
      costData = await costResponse.json();
    }

    // Return the data in the format expected by the MeetingsAnalytics component
    return {
      total_meetings: meetingData.total_meetings || 0,
      completed_meetings: meetingData.completed_meetings || 0,
      cancelled_meetings: meetingData.cancelled_meetings || 0,
      scheduled_meetings: meetingData.scheduled_meetings || 0,
      locations: meetingData.locations || [],
      types: meetingData.types || [],
      avg_cost_per_meeting: costData.avg_cost_per_meeting || 0,
      total_cost: costData.total_cost || 0
    };
  } catch (error) {
    console.error('Error in getMeetingAnalytics:', error);
    // Return default values instead of throwing an error
    return {
      total_meetings: 0,
      completed_meetings: 0,
      cancelled_meetings: 0,
      scheduled_meetings: 0,
      locations: [],
      types: [],
      avg_cost_per_meeting: 0,
      total_cost: 0
    };
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