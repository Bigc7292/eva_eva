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
    const days = parseInt(searchParams.get('days') || '30')
    
    // Calculate start date
    const startDate = subDays(new Date(), days).toISOString()
    
    // Get data from daily_analytics
    const { data: dailyAnalytics, error: dailyAnalyticsError } = await supabase
      .from('daily_analytics')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: true })

    if (dailyAnalyticsError) {
      console.error('Error fetching daily analytics:', dailyAnalyticsError)
      return NextResponse.json(
        { error: 'Failed to fetch daily analytics' },
        { status: 500 }
      )
    }

    // If no daily analytics data is available, calculate from enhanced_calls
    if (!dailyAnalytics || dailyAnalytics.length === 0) {
      // Get all calls within the date range
      const { data: calls, error: callsError } = await supabase
        .from('enhanced_calls')
        .select('*')
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: true })

      if (callsError) {
        console.error('Error fetching calls:', callsError)
        return NextResponse.json(
          { error: 'Failed to fetch calls' },
          { status: 500 }
        )
      }

      // Group calls by day
      const callsByDay = new Map()
      
      calls?.forEach(call => {
        const date = call.timestamp ? new Date(call.timestamp).toISOString().split('T')[0] : null
        if (!date) return
        
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
        
        if (call.outcome === 'successful') {
          dayData.successful_calls++
        } else if (call.outcome && call.outcome !== 'successful') {
          dayData.unsuccessful_calls++
        }
        
        if (call.duration) {
          dayData.durations.push(call.duration)
        }
      })
      
      // Calculate average durations
      const result = Array.from(callsByDay.values()).map(day => {
        const avgDuration = day.durations.length > 0
          ? day.durations.reduce((sum: number, duration: number) => sum + duration, 0) / day.durations.length
          : 0
          
        return {
          ...day,
          avg_call_duration: avgDuration,
          durations: undefined // Remove the durations array
        }
      })
      
      return NextResponse.json(result)
    }

    // Format the daily analytics data
    const formattedData = dailyAnalytics.map(day => ({
      call_date: format(new Date(day.date), 'MMM dd'),
      date: day.date,
      total_calls: day.total_calls,
      successful_calls: day.successful_calls,
      unsuccessful_calls: day.unsuccessful_calls,
      avg_call_duration: day.avg_call_duration
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error in daily analytics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
