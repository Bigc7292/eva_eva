import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

// Define interfaces for better type safety
interface Meeting {
  id: string;
  status: string;
  location?: string;
  type?: string;
  // Allow other properties with unknown type (safer than any)
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * GET /api/metrics/meetings
 * Retrieves meeting metrics from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Get meeting metrics directly from the meetings table
    const { data: meetingsData, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')

    if (meetingsError) {
      console.error('Error fetching meetings data:', meetingsError)
      // Return default metrics instead of error
      return NextResponse.json({
        total_meetings: 0,
        completed_meetings: 0,
        cancelled_meetings: 0,
        scheduled_meetings: 0,
        meeting_date: new Date().toISOString().split('T')[0],
        locations: [],
        types: []
      })
    }

    // Cast the data to our Meeting interface
    const meetings: Meeting[] = meetingsData || []

    // Calculate metrics
    const totalMeetings = meetings.length
    const completedMeetings = meetings.filter(m => m.status === 'completed').length
    const cancelledMeetings = meetings.filter(m => m.status === 'cancelled').length
    const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length

    // Get meeting locations
    const locationsRawData = meetings.filter(m => m.status !== 'cancelled')

    // Use proper typing for locationCounts
    const locationCounts: Record<string, number> = {}

    if (locationsRawData && locationsRawData.length > 0) {
      for (const item of locationsRawData) {
        const loc = item.location || 'Unknown'
        locationCounts[loc] = (locationCounts[loc] || 0) + 1
      }
    }

    // Get meeting types
    const typesRawData = meetings.filter(m => m.status !== 'cancelled')

    // Use proper typing for typeCounts
    const typeCounts: Record<string, number> = {}

    if (typesRawData && typesRawData.length > 0) {
      for (const item of typesRawData) {
        const type = item.type || 'Other'
        typeCounts[type] = (typeCounts[type] || 0) + 1
      }
    }

    // Format locations for response
    const locations = Object.entries(locationCounts).map(([location, count]) => ({
      location,
      count
    }))

    // Format types for response
    const types = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count
    }))

    return NextResponse.json({
      total_meetings: totalMeetings,
      completed_meetings: completedMeetings,
      cancelled_meetings: cancelledMeetings,
      scheduled_meetings: scheduledMeetings,
      meeting_date: new Date().toISOString().split('T')[0],
      locations,
      types
    })
  } catch (error) {
    console.error('Error fetching meeting metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting metrics' },
      { status: 500 }
    )
  }
}
