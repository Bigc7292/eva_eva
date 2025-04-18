import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/metrics/costs
 * Retrieves cost metrics from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Calculate cost metrics from enhanced_calls table
    const { data: totalCost, error: totalCostError } = await supabase
      .from('enhanced_calls')
      .select('cost')
      .not('cost', 'is', null)

    if (totalCostError) {
      console.error('Error fetching call costs:', totalCostError)
      return NextResponse.json(
        { error: 'Failed to fetch call costs' },
        { status: 500 }
      )
    }

    // Calculate total cost
    const sumTotalCost = totalCost?.reduce((sum, call) => sum + (Number(call.cost) || 0), 0) || 0

    // Calculate average cost per day
    const { data: callsByDay, error: callsByDayError } = await supabase
      .from('daily_analytics')
      .select('date, total_cost')
      .order('date', { ascending: false })
      .limit(30)

    if (callsByDayError) {
      console.error('Error fetching daily costs:', callsByDayError)
      return NextResponse.json(
        { error: 'Failed to fetch daily costs' },
        { status: 500 }
      )
    }

    const avgCostPerDay = callsByDay && callsByDay.length > 0
      ? callsByDay.reduce((sum, day) => sum + (Number(day.total_cost) || 0), 0) / callsByDay.length
      : 0

    // Calculate average cost per meeting
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('meeting_id')
      .neq('status', 'cancelled')

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError)
      return NextResponse.json(
        { error: 'Failed to fetch meetings' },
        { status: 500 }
      )
    }

    const totalMeetings = meetings?.length || 0
    const avgCostPerMeeting = totalMeetings > 0 ? sumTotalCost / totalMeetings : 0

    return NextResponse.json({
      total_cost: sumTotalCost,
      avg_cost_per_day: avgCostPerDay,
      avg_cost_per_meeting: avgCostPerMeeting,
      avg_cost_per_call: totalCost && totalCost.length > 0 ? sumTotalCost / totalCost.length : 0
    })
  } catch (error) {
    console.error('Error in cost metrics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
