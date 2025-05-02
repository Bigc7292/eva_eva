import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/metrics/calls
 * Retrieves call metrics from Supabase
 * Supports time range filtering with timeRange parameter:
 * - 'daily': Today only
 * - '7days': Last 7 days
 * - '30days': Last 30 days
 * - 'all': All time (default)
 * Can also filter by specific date range with start and end parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const timeRange = searchParams.get('timeRange') || 'all' // 'daily', '7days', '30days', 'all'

    // Calculate date ranges based on timeRange parameter
    const now = new Date()
    let startDate: string | null = start
    let endDate: string | null = end

    if (!startDate || !endDate) {
      if (timeRange === 'daily') {
        // Today only
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      } else if (timeRange === '7days') {
        // Last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        startDate = sevenDaysAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      } else if (timeRange === '30days') {
        // Last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        startDate = thirtyDaysAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      }
      // For 'all', we don't set date filters
    }

    console.log(`Fetching call metrics with timeRange: ${timeRange}, start: ${startDate}, end: ${endDate}`)

    // Get call metrics from the call_metrics view or filter by date range
    let callMetricsData: any = null
    let callsDataError: any = null

    if (timeRange === 'all' && !startDate && !endDate) {
      // Get all-time metrics from the call_metrics view
      const result = await supabase
        .from('call_metrics')
        .select('*')
        .single()

      callMetricsData = result.data
      callsDataError = result.error
    } else {
      // For specific time ranges, calculate metrics from filtered data
      // First, get the filtered calls
      const query = supabase
        .from('calls')
        .select('*')

      if (startDate) {
        query.gte('start_time', `${startDate}T00:00:00`)
      }

      if (endDate) {
        query.lte('start_time', `${endDate}T23:59:59`)
      }

      const { data: filteredCalls, error } = await query

      if (error) {
        callsDataError = error
      } else if (filteredCalls) {
        // Calculate metrics manually from filtered data
        const totalCalls = filteredCalls.length
        const answeredCalls = filteredCalls.filter(call =>
          ['completed', 'answered', 'successful'].includes(String(call.call_status || '').toLowerCase())
        ).length
        const missedCalls = filteredCalls.filter(call =>
          ['missed', 'no answer', 'no-answer', 'failed'].includes(String(call.call_status || '').toLowerCase())
        ).length

        // Check for both duration and call_duration fields
        const callsWithDuration = filteredCalls.filter(call =>
          ['completed', 'answered', 'successful'].includes(String(call.call_status || '').toLowerCase()) &&
          (call.duration != null || call.call_duration != null)
        )

        const avgDuration = callsWithDuration.length > 0
          ? callsWithDuration.reduce((sum, call) => {
              // Use call_duration if available, otherwise fall back to duration
              const callDuration = call.call_duration != null ? call.call_duration : (call.duration || 0)
              return sum + callDuration
            }, 0) / callsWithDuration.length
          : 0

        // Create a metrics object similar to what the view would return
        callMetricsData = {
          total_calls: totalCalls,
          answered_calls: answeredCalls,
          missed_calls: missedCalls,
          avg_duration: avgDuration,
          call_picked_up_rate: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
          call_successful_rate: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
          // Add other metrics as needed
        }
      }
    }

    if (callsDataError) {
      console.error('Error fetching calls data:', callsDataError)
      return NextResponse.json(
        { error: 'Failed to fetch calls data' },
        { status: 500 }
      )
    }

    // Extract metrics from the view or calculated data
    const totalCalls = callMetricsData?.total_calls || 0
    const answeredCalls = callMetricsData?.answered_calls || 0
    const missedCalls = callMetricsData?.missed_calls || 0
    const avgDuration = callMetricsData?.avg_duration || 0

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

      // Query the call_metrics_by_day view with appropriate filters
      let callsByDayQuery = supabase
        .from('call_metrics_by_day')
        .select('day, total_calls, answered_calls, missed_calls, avg_duration, call_picked_up_rate, call_successful_rate')
        .order('day', { ascending: false })

      // Apply date filters if specified
      const { searchParams } = new URL(request.url)
      const start = searchParams.get('start')
      const end = searchParams.get('end')
      const timeRange = searchParams.get('timeRange') || 'all' // 'daily', '7days', '30days', 'all'

      // Calculate date ranges based on timeRange parameter
      const now = new Date()
      let startDate: string | null = start
      let endDate: string | null = end

      if (!startDate || !endDate) {
        if (timeRange === 'daily' || timeRange === '1day') {
          // Today only
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0]
          endDate = new Date().toISOString().split('T')[0]
        } else if (timeRange === '7days') {
          // Last 7 days
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          startDate = sevenDaysAgo.toISOString().split('T')[0]
          endDate = new Date().toISOString().split('T')[0]
        } else if (timeRange === '30days') {
          // Last 30 days
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          startDate = thirtyDaysAgo.toISOString().split('T')[0]
          endDate = new Date().toISOString().split('T')[0]
        }
        // For 'all', we don't set date filters
      }

      // Apply date filters if specified
      if (startDate) {
        callsByDayQuery = callsByDayQuery.gte('day', startDate)
      }

      if (endDate) {
        callsByDayQuery = callsByDayQuery.lte('day', endDate)
      }

      // Limit results based on time range
      if (timeRange === 'daily' || timeRange === '1day') {
        callsByDayQuery = callsByDayQuery.limit(1)
      } else if (timeRange === '7days') {
        callsByDayQuery = callsByDayQuery.limit(7)
      } else if (timeRange === '30days') {
        callsByDayQuery = callsByDayQuery.limit(30)
      } else {
        // For 'all', limit to a reasonable number to prevent excessive data transfer
        callsByDayQuery = callsByDayQuery.limit(90) // 3 months of data
      }

      const { data: callsByDayData, error: callsByDayError } = await callsByDayQuery

      if (callsByDayError) {
        console.error('Error fetching calls by day:', callsByDayError)
      } else if (callsByDayData && callsByDayData.length > 0) {
        // Format the data for the response
        answeredPerDay = callsByDayData.map(row => ({
          call_date: row.day,
          answered_calls: row.answered_calls || 0
        }))

        // Calculate average answered calls per day
        avgAnsweredPerDay = answeredPerDay.length > 0
          ? answeredPerDay.reduce((sum, row) => sum + row.answered_calls, 0) / answeredPerDay.length
          : 0
      }

      // If no data was found in the view, provide empty results
      if (answeredPerDay.length === 0) {
        console.log('No call data found for the specified time range')

        // For daily view, at least return today with zero calls
        if (timeRange === 'daily') {
          answeredPerDay = [{
            call_date: new Date().toISOString().split('T')[0],
            answered_calls: 0
          }]
        }
      }
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
