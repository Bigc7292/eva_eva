import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/metrics/costs
 * Retrieves cost metrics from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Calculate cost metrics from calls table
    const { data: callsData, error: callsError } = await supabase
      .from('calls')
      .select('*')

    if (callsError) {
      console.error('Error fetching calls:', callsError)
      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: 500 }
      )
    }

    // Calculate estimated costs based on call duration
    // Assuming $0.15 to $0.40 per minute based on model and prompts
    const baseCostPerMinute = 0.15;
    let sumTotalCost = 0;

    if (callsData) {
      for (const call of callsData) {
        const duration = call.duration || call.call_duration || 0;
        const durationInMinutes = typeof duration === 'number' ? duration / 60 : 0;
        const callCost = durationInMinutes * baseCostPerMinute;
        sumTotalCost += callCost;
      }
    }

    // Group calls by day to calculate average cost per day
    const callsByDay = new Map();

    if (callsData) {
      for (const call of callsData) {
        try {
          const dateField = call.created_at || call.timestamp || call.date;
          if (dateField) {
            const date = new Date(dateField).toISOString().split('T')[0];

            if (!callsByDay.has(date)) {
              callsByDay.set(date, { totalCost: 0, count: 0 });
            }

            const duration = call.duration || call.call_duration || 0;
            const durationInMinutes = typeof duration === 'number' ? duration / 60 : 0;
            const callCost = durationInMinutes * baseCostPerMinute;

            const dayData = callsByDay.get(date);
            dayData.totalCost += callCost;
            dayData.count += 1;
          }
        } catch (error) {
          console.log('Error processing call date:', error);
        }
      }
    }

    // Calculate average cost per day
    let avgCostPerDay = 0;
    let totalDays = 0;

    for (const [_, dayData] of callsByDay) {
      avgCostPerDay += dayData.totalCost;
      totalDays++;
    }

    if (totalDays > 0) {
      avgCostPerDay = avgCostPerDay / totalDays;
    }

    // Calculate average cost per meeting
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('meeting_id')

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError)
      // Continue without meetings data
    }

    const totalMeetings = meetings?.length || 0
    const avgCostPerMeeting = totalMeetings > 0 ? sumTotalCost / totalMeetings : 0
    const avgCostPerCall = callsData && callsData.length > 0 ? sumTotalCost / callsData.length : 0

    // Calculate cost per minute
    const totalMinutes = callsData?.reduce((total, call) => {
      const duration = call.duration || call.call_duration || 0;
      return total + (typeof duration === 'number' ? duration / 60 : 0);
    }, 0) || 0;

    // Calculate the actual cost per minute based on total cost and minutes
    const actualCostPerMinute = totalMinutes > 0 ? sumTotalCost / totalMinutes : baseCostPerMinute

    return NextResponse.json({
      total_cost: sumTotalCost,
      avg_cost_per_day: avgCostPerDay,
      avg_cost_per_meeting: avgCostPerMeeting,
      avg_cost_per_call: avgCostPerCall,
      cost_per_minute: actualCostPerMinute,
      total_minutes: totalMinutes
    })
  } catch (error) {
    console.error('Error in cost metrics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
