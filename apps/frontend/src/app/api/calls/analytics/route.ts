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
      case 'all':
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
    
    // Get calls by status
    const { data: callsByStatus, error: statusError } = await supabase
      .rpc('get_calls_by_status', { start_date: startDateStr })
    
    if (statusError) {
      console.error('Error getting calls by status:', statusError)
      return NextResponse.json(
        { error: 'Failed to get call analytics' },
        { status: 500 }
      )
    }
    
    // Get calls by day
    const { data: callsByDay, error: dayError } = await supabase
      .rpc('get_calls_by_day', { start_date: startDateStr })
    
    if (dayError) {
      console.error('Error getting calls by day:', dayError)
      return NextResponse.json(
        { error: 'Failed to get call analytics' },
        { status: 500 }
      )
    }
    
    // Format dates for callsByDay
    const formattedCallsByDay = callsByDay?.map(day => ({
      date: format(new Date(day.date), 'MMM d'),
      count: day.count
    })) || []
    
    // Get calls by type
    const { data: callsByType, error: typeError } = await supabase
      .rpc('get_calls_by_type', { start_date: startDateStr })
    
    if (typeError) {
      console.error('Error getting calls by type:', typeError)
      return NextResponse.json(
        { error: 'Failed to get call analytics' },
        { status: 500 }
      )
    }
    
    // Get duration statistics
    const { data: durationStats, error: durationError } = await supabase
      .rpc('get_call_duration_stats', { start_date: startDateStr })
    
    if (durationError) {
      console.error('Error getting duration stats:', durationError)
      return NextResponse.json(
        { error: 'Failed to get call analytics' },
        { status: 500 }
      )
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
