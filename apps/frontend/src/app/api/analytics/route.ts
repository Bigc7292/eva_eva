import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

interface CallData {
  id?: string;
  call_id: string;
  phone_number?: string;
  start_time: string;
  end_time?: string;
  call_duration?: number;
  status?: string;
  call_status?: string;
  call_type?: string;
  agent_id?: string;
  agent_name?: string;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  [key: string]: unknown; // For any other properties
}

type Lead = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
  created_at?: string;
  successful_meetings?: number;
  [key: string]: unknown; // For any other properties
}

interface DailyCallCount {
  date: string;
  calls: number;
}

interface AgentCallData {
  agent_id: string;
  agent_name: string;
  calls: CallData[];
}

/**
 * GET /api/analytics
 * Retrieves analytics data from Supabase
 */
export async function GET(_request: NextRequest) {
  try {
    // Get calls from Supabase
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .order('start_time', { ascending: false })

    // Get leads from Supabase
    const { data: leads, error: leadsError } = await supabase
      .from('enhanced_leads')
      .select('*') as { data: Lead[] | null, error: Error | null }

    if (callsError) throw callsError
    if (leadsError) throw leadsError

    // Calculate analytics
    const totalCalls = calls?.length || 0
    const completedCalls = calls?.filter(call => call.status === 'completed' || call.call_status === 'completed').length || 0
    const inboundCalls = calls?.filter(call => call.call_type === 'Inbound').length || 0
    const outboundCalls = calls?.filter(call => call.call_type === 'Outbound').length || 0
    const missedCalls = calls?.filter(call => call.status === 'missed' || call.call_status === 'missed').length || 0

    // Calculate average call duration
    let averageCallDuration = 0
    if (totalCalls > 0) {
      const totalDuration = calls?.reduce((acc, call) => acc + (call.call_duration || 0), 0) || 0
      averageCallDuration = totalDuration / totalCalls
    }

    // Group calls by day
    const callsByDay: DailyCallCount[] = []
    const callDates: Record<string, number> = {}

    if (calls) {
      for (const call of calls) {
        const date = new Date(call.start_time).toISOString().split('T')[0]
        callDates[date] = (callDates[date] || 0) + 1
      }
    }

    for (const [date, count] of Object.entries(callDates)) {
      callsByDay.push({ date, calls: count })
    }

    // Group calls by agent
    const callsByAgent: AgentCallData[] = []
    const agentCalls: Record<string, AgentCallData> = {}

    if (calls) {
      for (const call of calls) {
        const agentName = call.agent_name || 'Unassigned'
        if (!agentCalls[agentName]) {
          agentCalls[agentName] = {
            agent_id: call.agent_id || 'unknown',
            agent_name: agentName,
            calls: []
          }
        }
        agentCalls[agentName].calls.push(call)
      }
    }

    for (const agent of Object.values(agentCalls)) {
      callsByAgent.push(agent)
    }

    // If no data, return empty analytics
    if (totalCalls === 0) {
      console.log('No call data found in database');
    }

    // Calculate lead analytics
    const totalLeads = leads?.length || 0
    const today = new Date().toISOString().split('T')[0]
    const newLeadsToday = leads?.filter(lead =>
      lead.created_at && new Date(lead.created_at).toISOString().split('T')[0] === today
    ).length || 0

    const convertedLeads = leads?.filter(lead => (lead.successful_meetings ?? 0) > 0 || lead.status === 'booked').length || 0
    const leadsConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    // Return analytics data
    return NextResponse.json({
      totalCalls,
      completedCalls,
      inboundCalls,
      outboundCalls,
      missedCalls,
      averageCallDuration,
      callsByDay,
      callsByAgent,
      totalLeads,
      newLeadsToday,
      leadsConversionRate,
      leadsByStatus: [
        { status: 'Active', count: totalLeads - convertedLeads },
        { status: 'Converted', count: convertedLeads }
      ]
    })
  } catch (error) {
    console.error('Failed to fetch analytics data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
