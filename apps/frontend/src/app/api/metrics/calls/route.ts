import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/metrics/calls
 * Retrieves call metrics from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Get call metrics directly from the calls table
    const { data: callsData, error: callsDataError } = await supabase
      .from('calls')
      .select('call_status, call_duration')

    if (callsDataError) {
      console.error('Error fetching calls data:', callsDataError)
      return NextResponse.json(
        { error: 'Failed to fetch calls data' },
        { status: 500 }
      )
    }

    // Calculate metrics manually
    const totalCalls = callsData?.length || 0
    const answeredCalls = callsData?.filter(c =>
      c.call_status === 'Completed' || c.call_status === 'Answered'
    ).length || 0
    const missedCalls = callsData?.filter(c =>
      c.call_status === 'Missed' || c.call_status === 'No Answer'
    ).length || 0
    const totalDuration = callsData?.reduce((sum, call) => sum + (call.call_duration || 0), 0) || 0
    const avgDuration = answeredCalls > 0 ? totalDuration / answeredCalls : 0

    const callMetrics = {
      total_calls: totalCalls,
      answered_calls: answeredCalls,
      missed_calls: missedCalls,
      answer_rate: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
      avg_duration: avgDuration
    }

    // Calculate average calls per meeting
    // We already have totalCalls from above, no need to query again

    const { count: totalMeetings, error: meetingsCountError } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'cancelled')

    if (meetingsCountError) {
      console.error('Error counting meetings:', meetingsCountError)
      return NextResponse.json(
        { error: 'Failed to count meetings' },
        { status: 500 }
      )
    }

    const avgCallsPerMeeting = totalMeetings && totalMeetings > 0
      ? Number(totalCalls) / Number(totalMeetings)
      : 0

    // Calculate average answered calls per day
    const { data: answeredPerDay, error: answeredPerDayError } = await supabase
      .rpc('get_answered_calls_per_day')

    if (answeredPerDayError) {
      console.error('Error getting answered calls per day:', answeredPerDayError)
      // Continue without this metric if the function doesn't exist
    }

    // Define the type for the row
    interface AnsweredCallsRow {
      call_date: string;
      answered_calls: number;
    }

    const avgAnsweredPerDay = answeredPerDay && answeredPerDay.length > 0
      ? answeredPerDay.reduce((sum: number, row: AnsweredCallsRow) => sum + Number(row.answered_calls), 0) / answeredPerDay.length
      : 0

    return NextResponse.json({
      ...callMetrics,
      avg_calls_per_meeting: avgCallsPerMeeting,
      avg_answered_per_day: avgAnsweredPerDay
    })
  } catch (error) {
    console.error('Error in call metrics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
