import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/metrics/meetings
 * Retrieves meeting metrics from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Get meeting metrics directly from the meetings table
    const { data: meetingsData, error: meetingsError } = await supabase
      .from('meetings')
      .select('timestamp, status')

    if (meetingsError) {
      console.error('Error fetching meetings data:', meetingsError)
      return NextResponse.json(
        { error: 'Failed to fetch meetings data' },
        { status: 500 }
      )
    }

    // Calculate metrics manually
    const today = new Date()
    const meetingMetrics = {
      total_meetings: meetingsData?.length || 0,
      completed_meetings: meetingsData?.filter(m => m.status === 'completed').length || 0,
      cancelled_meetings: meetingsData?.filter(m => m.status === 'cancelled').length || 0,
      scheduled_meetings: meetingsData?.filter(m => m.status === 'scheduled').length || 0,
      meeting_date: today.toISOString().split('T')[0]
    }

    // No need to check for meetingMetricsError as we calculated it manually

    // Get meeting locations directly from the meetings table
    const { data: locationsRawData, error: locationsRawError } = await supabase
      .from('meetings')
      .select('location')
      .neq('status', 'cancelled')

    if (locationsRawError) {
      console.error('Error fetching meeting locations:', locationsRawError)
      return NextResponse.json(
        { error: 'Failed to fetch meeting locations' },
        { status: 500 }
      )
    }

  // Calculate location counts manually
  const locationCounts: Record<string, number> = {}
    if (locationsRawData) {
      for (const item of locationsRawData) {
        const loc = item.location || 'Unknown'
        locationCounts[loc] = (locationCounts[loc] || 0) + 1
      }
    }

    // Format locations data
    const locations = Object.entries(locationCounts).map(([location, count]) => ({
      location,
      count: Number(count)
    }))

    return NextResponse.json({
      ...meetingMetrics,
      locations
    })
  } catch (error) {
    console.error('Error in meeting metrics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
