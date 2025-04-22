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

    // Calculate metrics manually
    const today = new Date()
    const meetingMetrics = {
      total_meetings: meetingsData?.length || 0,
      completed_meetings: meetingsData?.filter(m => {
        const status = String(m.status || '').toLowerCase();
        return status === 'completed' || status === 'done';
      }).length || 0,
      cancelled_meetings: meetingsData?.filter(m => {
        const status = String(m.status || '').toLowerCase();
        return status === 'cancelled' || status === 'canceled';
      }).length || 0,
      scheduled_meetings: meetingsData?.filter(m => {
        const status = String(m.status || '').toLowerCase();
        return status === 'scheduled' || status === 'pending';
      }).length || 0,
      meeting_date: today.toISOString().split('T')[0]
    }

    // No need to check for meetingMetricsError as we calculated it manually

    // Calculate location and type counts from meetings data
    const locationCounts = {};
    const typesCounts = {};

    if (meetingsData) {
      for (const meeting of meetingsData) {
        // Count locations
        const location = meeting.location || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;

        // Count types
        const type = meeting.type || 'Standard';
        typesCounts[type] = (typesCounts[type] || 0) + 1;
      }
    }

    // Format locations data
    const locations = Object.entries(locationCounts).map(([location, count]) => ({
      location,
      count: Number(count)
    }));

    // Format types data
    const types = Object.entries(typesCounts).map(([type, count]) => ({
      type,
      count: Number(count)
    }))

    // Add default values if no meetings exist
    if (meetingMetrics.total_meetings === 0) {
      return NextResponse.json({
        total_meetings: 0,
        completed_meetings: 0,
        cancelled_meetings: 0,
        scheduled_meetings: 0,
        meeting_date: new Date().toISOString().split('T')[0],
        locations: [{ location: 'Dubai Office', count: 0 }],
        types: [{ type: 'Standard', count: 0 }]
      });
    }

    return NextResponse.json({
      ...meetingMetrics,
      locations,
      types
    })
  } catch (error) {
    console.error('Error in meeting metrics API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
