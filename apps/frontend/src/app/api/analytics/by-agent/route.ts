import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/analytics/by-agent
 * Retrieves analytics data grouped by agent
 */
export async function GET(request: NextRequest) {
  try {
    // Get data from agent_analytics
    const { data: agentAnalytics, error: agentAnalyticsError } = await supabase
      .from('agent_analytics')
      .select('*')
      .order('total_calls', { ascending: false })

    if (agentAnalyticsError) {
      console.error('Error fetching agent analytics:', agentAnalyticsError)
      return NextResponse.json(
        { error: 'Failed to fetch agent analytics' },
        { status: 500 }
      )
    }

    // If no agent analytics data is available, calculate from enhanced_calls
    if (!agentAnalytics || agentAnalytics.length === 0) {
      // Get all calls
      const { data: calls, error: callsError } = await supabase
        .from('enhanced_calls')
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
      
      calls?.forEach(call => {
        const agentId = call.agent_id
        if (!agentId) return
        
        if (!callsByAgent.has(agentId)) {
          callsByAgent.set(agentId, {
            agent_id: agentId,
            agent_name: call.agent_name || 'Unknown Agent',
            total_calls: 0,
            successful_calls: 0,
            unsuccessful_calls: 0,
            durations: [],
            answered_calls: 0,
            voicemail_count: 0
          })
        }
        
        const agentData = callsByAgent.get(agentId)
        agentData.total_calls++
        
        if (call.outcome === 'successful') {
          agentData.successful_calls++
        } else if (call.outcome && call.outcome !== 'successful') {
          agentData.unsuccessful_calls++
        }
        
        if (call.duration) {
          agentData.durations.push(call.duration)
        }
        
        if (call.answered === true) {
          agentData.answered_calls++
        }
        
        if (call.disconnection_reason === 'voicemail') {
          agentData.voicemail_count++
        }
      })
      
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
          
        const voicemailRate = agent.total_calls > 0 
          ? agent.voicemail_count / agent.total_calls 
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
          voicemail_count: agent.voicemail_count,
          voicemail_rate: voicemailRate,
          // Add placeholder values for meeting metrics
          total_meetings: 0,
          meetings_completed: 0,
          meetings_cancelled: 0,
          meetings_no_show: 0
        }
      })
      
      return NextResponse.json(result)
    }

    // Return the agent analytics data
    return NextResponse.json(agentAnalytics)
  } catch (error) {
    console.error('Error in agent analytics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
