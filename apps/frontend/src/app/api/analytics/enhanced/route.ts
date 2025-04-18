import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/analytics/enhanced
 * Retrieves enhanced analytics data from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Get data from daily_analytics for the most recent day
    const { data: dailyAnalytics, error: dailyAnalyticsError } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (dailyAnalyticsError) {
      console.error('Error fetching daily analytics:', dailyAnalyticsError)
      return NextResponse.json(
        { error: 'Failed to fetch daily analytics' },
        { status: 500 }
      )
    }

    // If no daily analytics data is available, calculate from enhanced_calls
    if (!dailyAnalytics) {
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

      // Calculate metrics
      const total_calls = calls?.length || 0
      const successful_calls = calls?.filter(call => call.outcome === 'successful').length || 0
      const unsuccessful_calls = calls?.filter(call => call.outcome !== 'successful' && call.outcome !== null).length || 0
      const unknown_outcome_calls = calls?.filter(call => call.outcome === null).length || 0
      
      // Calculate durations
      const durations = calls?.map(call => call.duration).filter(Boolean) || []
      const avg_call_duration = durations.length > 0 
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
        : 0
      const max_call_duration = durations.length > 0 ? Math.max(...durations) : 0
      const min_call_duration = durations.length > 0 ? Math.min(...durations) : 0
      
      // Calculate latencies
      const latencies = calls?.map(call => call.latency).filter(Boolean) || []
      const avg_call_latency = latencies.length > 0 
        ? latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length 
        : 0
      
      // Calculate rates
      const answered_calls = calls?.filter(call => call.answered === true).length || 0
      const call_picked_up_rate = total_calls > 0 ? answered_calls / total_calls : 0
      const call_successful_rate = answered_calls > 0 ? successful_calls / answered_calls : 0
      
      // Calculate disconnection reasons
      const dial_no_answer_count = calls?.filter(call => call.disconnection_reason === 'dial_no_answer').length || 0
      const customer_hangup_count = calls?.filter(call => call.disconnection_reason === 'customer_ended').length || 0
      const agent_hangup_count = calls?.filter(call => call.disconnection_reason === 'agent_ended').length || 0
      const voicemail_count = calls?.filter(call => call.disconnection_reason === 'voicemail').length || 0
      const dial_failed_count = calls?.filter(call => call.disconnection_reason === 'dial_failed').length || 0
      const voicemail_rate = total_calls > 0 ? voicemail_count / total_calls : 0
      
      // Calculate call directions
      const inbound_calls = calls?.filter(call => call.call_direction === 'inbound').length || 0
      const outbound_calls = calls?.filter(call => call.call_direction === 'outbound').length || 0
      const unknown_direction_calls = calls?.filter(call => call.call_direction === null).length || 0

      return NextResponse.json({
        total_calls,
        successful_calls,
        unsuccessful_calls,
        unknown_outcome_calls,
        avg_call_duration,
        max_call_duration,
        min_call_duration,
        avg_call_latency,
        call_picked_up_rate,
        call_successful_rate,
        dial_no_answer_count,
        customer_hangup_count,
        agent_hangup_count,
        voicemail_count,
        dial_failed_count,
        voicemail_rate,
        inbound_calls,
        outbound_calls,
        unknown_direction_calls
      })
    }

    // Return the daily analytics data
    return NextResponse.json({
      total_calls: dailyAnalytics.total_calls,
      successful_calls: dailyAnalytics.successful_calls,
      unsuccessful_calls: dailyAnalytics.unsuccessful_calls,
      unknown_outcome_calls: dailyAnalytics.unknown_outcome_calls,
      avg_call_duration: dailyAnalytics.avg_call_duration,
      max_call_duration: dailyAnalytics.max_call_duration,
      min_call_duration: dailyAnalytics.min_call_duration,
      avg_call_latency: dailyAnalytics.avg_call_latency,
      call_picked_up_rate: dailyAnalytics.call_picked_up_rate,
      call_successful_rate: dailyAnalytics.call_successful_rate,
      dial_no_answer_count: dailyAnalytics.dial_no_answer_count,
      customer_hangup_count: dailyAnalytics.customer_hangup_count,
      agent_hangup_count: dailyAnalytics.agent_hangup_count,
      voicemail_count: dailyAnalytics.voicemail_count,
      dial_failed_count: dailyAnalytics.dial_failed_count,
      voicemail_rate: dailyAnalytics.voicemail_rate,
      inbound_calls: dailyAnalytics.inbound_calls,
      outbound_calls: dailyAnalytics.outbound_calls,
      unknown_direction_calls: dailyAnalytics.unknown_direction_calls
    })
  } catch (error) {
    console.error('Error in enhanced analytics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
