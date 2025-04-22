import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'
import { format, subDays } from 'date-fns'

/**
 * GET /api/calls/analytics
 * Get call analytics data
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || '7d'

    // Calculate date range based on time range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7)
        break
      case '30d':
        startDate = subDays(now, 30)
        break
      case '90d':
        startDate = subDays(now, 90)
        break
      default:
        startDate = new Date(0) // Beginning of time
        break
    }

    const startDateStr = startDate.toISOString()

    // Get total calls
    const { count: totalCalls, error: countError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', startDateStr)

    if (countError) {
      console.error('Error getting total calls:', countError)
      return NextResponse.json(
        { error: 'Failed to get call analytics' },
        { status: 500 }
      )
    }

    // Get calls by status using direct query instead of RPC
    let callsByStatus = [];
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('call_status, count')
        .gte('start_time', startDateStr)
        .group('call_status');

      if (error) {
        console.error('Error getting calls by status:', error);
      } else {
        callsByStatus = data.map(item => ({
          status: item.call_status || 'Unknown',
          count: Number.parseInt(item.count) || 0
        }));
      }
    } catch (statusError) {
      console.error('Error in calls by status query:', statusError);
      // Continue with other queries
    }

    // Get calls by day using direct query
    let callsByDay = [];
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('start_time')
        .gte('start_time', startDateStr);

      if (error) {
        console.error('Error getting calls by day:', error);
      } else if (data) {
        // Process the data to group by day
        const dayMap = new Map();

        for (const call of data) {
          if (call.start_time) {
            const date = new Date(call.start_time).toISOString().split('T')[0];
            dayMap.set(date, (dayMap.get(date) || 0) + 1);
          }
        }

        callsByDay = Array.from(dayMap.entries()).map(([date, count]) => ({
          date,
          count
        }));
      }
    } catch (dayError) {
      console.error('Error in calls by day query:', dayError);
      // Continue with other queries
    }

    // Format dates for callsByDay
    const formattedCallsByDay = callsByDay?.map(day => ({
      date: format(new Date(day.date), 'MMM d'),
      count: day.count
    })) || []

    // Get calls by type using direct query
    let callsByType = [];
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('call_type, count')
        .gte('start_time', startDateStr)
        .group('call_type');

      if (error) {
        console.error('Error getting calls by type:', error);
      } else {
        callsByType = data.map(item => ({
          type: item.call_type || 'Unknown',
          count: Number.parseInt(item.count) || 0
        }));
      }
    } catch (typeError) {
      console.error('Error in calls by type query:', typeError);
      // Continue with other queries
    }

    // Get duration statistics using direct query
    let durationStats = [{
      average: 0,
      min: 0,
      max: 0,
      total: 0
    }];

    try {
      const { data, error } = await supabase
        .from('calls')
        .select('duration')
        .gte('start_time', startDateStr)
        .not('duration', 'is', null);

      if (error) {
        console.error('Error getting duration stats:', error);
      } else if (data && data.length > 0) {
        const durations = data.map(call => call.duration || 0).filter(d => d > 0);

        if (durations.length > 0) {
          const total = durations.reduce((sum, d) => sum + d, 0);
          const average = Math.round(total / durations.length);
          const min = Math.min(...durations);
          const max = Math.max(...durations);

          durationStats = [{
            average,
            min,
            max,
            total
          }];
        }
      }
    } catch (durationError) {
      console.error('Error in duration stats query:', durationError);
      // Continue with other queries
    }

    // Calculate success rate
    const completedCalls = callsByStatus?.find(status => status.status === 'Completed')?.count || 0
    const successRate = totalCalls ? Math.round((completedCalls / totalCalls) * 100) : 0

    // Prepare analytics data
    const analytics = {
      totalCalls: totalCalls || 0,
      callsByStatus: callsByStatus || [],
      callsByDay: formattedCallsByDay,
      callsByType: callsByType || [],
      durationStats: durationStats?.[0] || {
        average: 0,
        min: 0,
        max: 0,
        total: 0
      },
      successRate
    }

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error('Error in call analytics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
