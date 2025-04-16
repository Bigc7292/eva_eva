import { supabase } from '@/lib/services/supabase';

export class AnalyticsError extends Error {
  details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'AnalyticsError';
    this.details = details;
  }
}

export async function getCallAnalytics(): Promise<any> {
  try {
    // Try to get all columns first to handle different table structures
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .order('start_time', { ascending: false });

    if (callsError) {
      console.error('Error fetching calls with all columns:', callsError);

      // Try with a more specific query that matches the expected structure
      const { data: fallbackCalls, error: fallbackError } = await supabase
        .from('calls')
        .select('id, call_id, status, start_time, customer_phone, call_type')
        .order('start_time', { ascending: false });

      if (fallbackError) {
        throw new AnalyticsError('Failed to fetch calls', fallbackError);
      }

      // Use the fallback data
      return {
        totalCalls: fallbackCalls?.length || 0,
        inboundCalls: fallbackCalls?.filter(call => call.call_type === 'inbound').length || 0,
        outboundCalls: fallbackCalls?.filter(call => call.call_type === 'outbound').length || 0,
        missedCalls: fallbackCalls?.filter(call => call.status === 'missed').length || 0,
        completedCalls: fallbackCalls?.filter(call => call.status === 'completed').length || 0,
        averageCallDuration: 0,
        calls: fallbackCalls || [],
        callsByDay: [],
        callsByType: [],
        callsByStatus: [],
        callsByAgent: [],
        recentCalls: fallbackCalls?.slice(0, 10) || []
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Handle the case where calls might be empty
    if (!calls || calls.length === 0) {
      return {
        totalCalls: 0,
        inboundCalls: 0,
        outboundCalls: 0,
        missedCalls: 0,
        completedCalls: 0,
        averageCallDuration: 0,
        calls: [],
        callsByDay: [],
        callsByType: [],
        callsByStatus: [],
        callsByAgent: [],
        recentCalls: []
      };
    }

    return {
      totalCalls: calls.length,
      inboundCalls: calls.filter(call => call.call_type === 'inbound').length,
      outboundCalls: calls.filter(call => call.call_type === 'outbound').length,
      missedCalls: calls.filter(call => call.status === 'missed').length,
      completedCalls: calls.filter(call => call.status === 'completed').length,
      averageCallDuration: calls.reduce((acc, call) => acc + (call.call_duration || 0), 0) / calls.length,
      calls: calls, // Add the raw calls data
      callsByDay: groupCallsByDay(calls),
      callsByType: groupCallsByType(calls),
      callsByStatus: groupCallsByStatus(calls),
      callsByAgent: await groupCallsByAgent(calls),
      recentCalls: calls.slice(0, 10)
    };
  } catch (error) {
    console.error('Error in getCallAnalytics:', error);
    throw error;
  }
}

export async function getLeadAnalytics(): Promise<any> {
  try {
    const { data: leads, error: leadsError } = await supabase
      .from('lead_profiles')
      .select('*');

    if (leadsError) {
      throw new AnalyticsError('Failed to fetch leads', leadsError);
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Handle the case where leads might be empty
    if (!leads || leads.length === 0) {
      return {
        totalLeads: 0,
        newLeadsToday: 0,
        leadsConversionRate: 0,
        leadsByStatus: [],
        leadsBySource: [],
        leadsByLocation: []
      };
    }

    return {
      totalLeads: leads.length,
      newLeadsToday: leads.filter(lead =>
        lead.first_contact_date && lead.first_contact_date.split('T')[0] === today
      ).length,
      leadsConversionRate: calculateConversionRate(leads),
      leadsByStatus: groupLeadsByStatus(leads),
      leadsBySource: groupLeadsBySource(leads),
      leadsByLocation: groupLeadsByLocation(leads)
    };
  } catch (error) {
    console.error('Error in getLeadAnalytics:', error);
    throw error;
  }
}

function groupCallsByDay(calls: any[]): any[] {
  const grouped = calls.reduce((acc, call) => {
    const date = new Date(call.start_time).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    calls: count
  }));
}

function groupCallsByType(calls: any[]): any[] {
  return Object.entries(
    calls.reduce((acc, call) => {
      acc[call.call_type] = (acc[call.call_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({ type, count }));
}

function groupCallsByStatus(calls: any[]): any[] {
  return Object.entries(
    calls.reduce((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));
}

async function groupCallsByAgent(calls: any[]): Promise<any[]> {
  try {
    // Get unique agent names from calls instead of users table
    const agentMap = new Map(calls
      .filter(call => call.agent_id && call.agent_name)
      .map(call => [call.agent_id, call.agent_name]) as [string, string][]);

    return Object.entries(
      calls.reduce((acc, call) => {
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

function calculateConversionRate(leads: any[]): number {
  const converted = leads.filter(lead => lead.successful_meetings > 0).length;
  return leads.length > 0 ? (converted / leads.length) * 100 : 0;
}

function groupLeadsByStatus(leads: any[]): any[] {
  return Object.entries(
    leads.reduce((acc, lead) => {
      const status = lead.successful_meetings > 0 ? 'Converted' : 'Active';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));
}

function groupLeadsBySource(leads: any[]): any[] {
  return Object.entries(
    leads.reduce((acc, lead) => {
      acc[lead.source || 'Unknown'] = (acc[lead.source || 'Unknown'] || 0) + 1;
      return acc;
    }, {})
  ).map(([source, count]) => ({ source, count }));
}

function groupLeadsByLocation(leads: any[]): any[] {
  return Object.entries(
    leads.reduce((acc, lead) => {
      acc[lead.location || 'Unknown'] = (acc[lead.location || 'Unknown'] || 0) + 1;
      return acc;
    }, {})
  ).map(([location, count]) => ({ location, count }));
}