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
      .select('*')

    if (callsDataError) {
      console.error('Error fetching calls data:', callsDataError)
      return NextResponse.json(
        { error: 'Failed to fetch calls data' },
        { status: 500 }
      )
    }

    // Calculate metrics manually
    const totalCalls = callsData?.length || 0
    const answeredCalls = callsData?.filter(c => {
      const status = String(c.status || c.call_status || '').toLowerCase();
      return status === 'completed' || status === 'answered';
    }).length || 0

    const missedCalls = callsData?.filter(c => {
      const status = String(c.status || c.call_status || '').toLowerCase();
      return status === 'missed' || status === 'no answer';
    }).length || 0

    const totalDuration = callsData?.reduce((sum, call) => {
      const duration = call.duration || call.call_duration || 0;
      return sum + (typeof duration === 'number' ? duration : 0);
    }, 0) || 0

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

    // Define the type for the row
    interface AnsweredCallsRow {
      call_date: string;
      answered_calls: number;
    }

    // Try to use the RPC function first
    let answeredPerDay: AnsweredCallsRow[] = [];
    let avgAnsweredPerDay = 0;

    try {
      const { data, error } = await supabase
        .rpc('get_answered_calls_per_day')

      if (error) {
        console.error('Error getting answered calls per day:', error)
        // If RPC fails, we'll calculate it manually below
      } else if (data && data.length > 0) {
        answeredPerDay = data;
        avgAnsweredPerDay = answeredPerDay.reduce(
          (sum: number, row: AnsweredCallsRow) => sum + Number(row.answered_calls), 0
        ) / answeredPerDay.length;
      }
    } catch (rpcError) {
      console.error('RPC function not available, calculating manually:', rpcError);
    }

    // If we don't have data from the RPC function, calculate manually
    if (answeredPerDay.length === 0) {
      console.log('No data from RPC function, will calculate manually');
      // Manual calculation logic will be executed below
    }

    // If RPC failed or returned no data, calculate manually
    if (answeredPerDay.length === 0 && callsData && callsData.length > 0) {
      console.log('Calculating answered calls per day manually');
      // Group calls by date
      const callsByDate = new Map<string, number>();

      for (const call of callsData) {
        try {
          // Check if call was answered
          const status = String(call.status || call.call_status || '').toLowerCase();
          if (status !== 'completed' && status !== 'answered') continue;

          // Get the date
          const dateField = call.created_at || call.timestamp || call.date;
          if (!dateField) continue;

          const date = new Date(dateField).toISOString().split('T')[0];
          callsByDate.set(date, (callsByDate.get(date) || 0) + 1);
        } catch (error) {
          console.error('Error processing call date:', error);
        }
      }

      // Convert to array format
      answeredPerDay = Array.from(callsByDate.entries()).map(([call_date, answered_calls]) => ({
        call_date,
        answered_calls
      }));

      // Calculate average
      avgAnsweredPerDay = answeredPerDay.length > 0
        ? answeredPerDay.reduce((sum, row) => sum + row.answered_calls, 0) / answeredPerDay.length
        : 0;
    }

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
