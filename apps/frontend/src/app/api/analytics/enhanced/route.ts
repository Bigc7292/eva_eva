import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/analytics/enhanced
 * Retrieves enhanced analytics data from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Get all calls from the regular calls table
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

    // Calculate metrics based on call status
    const total_calls = calls?.length || 0
    const successful_calls = calls?.filter(call => {
      const status = String(call.status || '').toLowerCase();
      return status === 'completed' || status === 'answered';
    }).length || 0;
    const unsuccessful_calls = calls?.filter(call => {
      const status = String(call.status || '').toLowerCase();
      return status === 'missed' || status === 'failed' || status === 'no answer';
    }).length || 0;
    const unknown_outcome_calls = total_calls - successful_calls - unsuccessful_calls;

    // Calculate durations
    const durations = calls?.map(call => call.duration || call.call_duration).filter(Boolean) || []
    const avg_call_duration = durations.length > 0
      ? durations.reduce((sum, duration) => sum + Number(duration), 0) / durations.length
      : 0
    const max_call_duration = durations.length > 0 ? Math.max(...durations.map(d => Number(d))) : 0
    const min_call_duration = durations.length > 0 ? Math.min(...durations.map(d => Number(d))) : 0

    // Calculate call types
    const inbound_calls = calls?.filter(call => {
      const type = String(call.type || call.call_type || '').toLowerCase();
      return type === 'inbound' || type === 'incoming';
    }).length || 0;

    const outbound_calls = calls?.filter(call => {
      const type = String(call.type || call.call_type || '').toLowerCase();
      return type === 'outbound' || type === 'outgoing';
    }).length || 0;

    const unknown_direction_calls = total_calls - inbound_calls - outbound_calls;

    // Calculate rates
    const call_picked_up_rate = total_calls > 0 ? successful_calls / total_calls : 0

    // Return the calculated analytics
    return NextResponse.json({
      total_calls,
      successful_calls,
      unsuccessful_calls,
      unknown_outcome_calls,
      avg_call_duration,
      max_call_duration,
      min_call_duration,
      call_picked_up_rate,
      inbound_calls,
      outbound_calls,
      unknown_direction_calls
    })
  } catch (error) {
    console.error('Error in enhanced analytics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
