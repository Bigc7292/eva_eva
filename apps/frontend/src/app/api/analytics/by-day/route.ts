import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'
import { format, subDays } from 'date-fns'

/**
 * GET /api/analytics/by-day
 * Retrieves analytics data grouped by day
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const days = Number.parseInt(searchParams.get('days') || '30')

    // Calculate start date
    const startDate = subDays(new Date(), days).toISOString()

    // Get all calls within the date range
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

    // Group calls by day
    const callsByDay = new Map()

    // Process each call and group by date
    if (calls) {
      for (const call of calls) {
        // Try different date fields
        const dateField = call.timestamp || call.created_at || call.date;
        if (!dateField) continue;

        // Extract the date part
        let date: string;
        try {
          date = new Date(dateField).toISOString().split('T')[0];
        } catch (e) {
          continue; // Skip if date is invalid
        }

        // Initialize the day data if not exists
        if (!callsByDay.has(date)) {
          callsByDay.set(date, {
            call_date: format(new Date(date), 'MMM dd'),
            date: date,
            total_calls: 0,
            successful_calls: 0,
            unsuccessful_calls: 0,
            avg_call_duration: 0,
            durations: []
          })
        }

        const dayData = callsByDay.get(date)
        dayData.total_calls++

        // Check call status
        const status = String(call.status || '').toLowerCase();
        if (status === 'completed' || status === 'answered') {
          dayData.successful_calls++;
        } else if (status === 'missed' || status === 'failed' || status === 'no answer') {
          dayData.unsuccessful_calls++;
        }

        // Add duration if available
        const duration = call.duration || call.call_duration;
        if (duration) {
          dayData.durations.push(Number(duration));
        }
      }
    }

    // Calculate average durations and format the result
    const result = Array.from(callsByDay.values()).map(day => {
      const avgDuration = day.durations.length > 0
        ? day.durations.reduce((sum, duration) => sum + duration, 0) / day.durations.length
        : 0

      return {
        ...day,
        avg_call_duration: avgDuration,
        durations: undefined // Remove the durations array
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in daily analytics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
