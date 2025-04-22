import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/analytics/by-agent
 * Retrieves analytics data grouped by agent
 */
export async function GET(request: NextRequest) {
  try {
    // Get all calls
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')

    if (callsError) {
      console.error('Error fetching calls:', callsError)
      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: 500 }
      )
    }

    // Group calls by agent
    const callsByAgent = new Map()

    // Process each call and group by agent
    if (calls) {
      for (const call of calls) {
        const agentId = call.agent_id || call.agent || 'unknown';
        const agentName = call.agent_name || call.agent || 'Unknown Agent';

        // Initialize the agent data if not exists
        if (!callsByAgent.has(agentId)) {
          callsByAgent.set(agentId, {
            agent_id: agentId,
            agent_name: agentName,
            total_calls: 0,
            successful_calls: 0,
            unsuccessful_calls: 0,
            durations: [],
            answered_calls: 0
          })
        }

        const agentData = callsByAgent.get(agentId)
        agentData.total_calls++

        // Check call status
        const status = String(call.status || '').toLowerCase();
        if (status === 'completed' || status === 'answered') {
          agentData.successful_calls++;
          agentData.answered_calls++;
        } else if (status === 'missed' || status === 'failed' || status === 'no answer') {
          agentData.unsuccessful_calls++;
        }

        // Add duration if available
        const duration = call.duration || call.call_duration;
        if (duration) {
          agentData.durations.push(Number(duration));
        }
      }
    }

    // Calculate averages and rates
    const result = Array.from(callsByAgent.values()).map(agent => {
      const avgDuration = agent.durations.length > 0
        ? agent.durations.reduce((sum, duration) => sum + duration, 0) / agent.durations.length
        : 0

      const callPickedUpRate = agent.total_calls > 0
        ? agent.answered_calls / agent.total_calls
        : 0

      const callSuccessfulRate = agent.answered_calls > 0
        ? agent.successful_calls / agent.answered_calls
        : 0

      return {
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        total_calls: agent.total_calls,
        successful_calls: agent.successful_calls,
        unsuccessful_calls: agent.unsuccessful_calls,
        avg_call_duration: avgDuration,
        call_picked_up_rate: callPickedUpRate,
        call_successful_rate: callSuccessfulRate,
        // Add placeholder values for meeting metrics
        total_meetings: 0,
        meetings_completed: 0,
        meetings_cancelled: 0,
        meetings_no_show: 0
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in agent analytics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
