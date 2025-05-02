import { NextResponse } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/calls/recent
 * Returns a list of recent calls
 */
export async function GET() {
  try {
    // Get recent calls from the database
    // Recent calls are those with status 'Completed', 'Missed', 'No Answer', 'Failed', etc.
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .not('call_status', 'in', '("In Progress","Ringing","Answered","started")')
      .order('start_time', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent calls:', error)
      return NextResponse.json({ error: 'Failed to fetch recent calls' }, { status: 500 })
    }

    // Transform the data for the frontend
    const recentCalls = data.map(call => {
      // Calculate duration in seconds if available
      let duration = call.call_duration || call.duration || 0
      
      // If we have start and end time but no duration, calculate it
      if (!duration && call.start_time && call.end_time) {
        const startTime = new Date(call.start_time)
        const endTime = new Date(call.end_time)
        duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      }

      return {
        id: call.id || call.call_id,
        call_id: call.call_id,
        contact_id: call.contact_id,
        phone_number: call.phone_number || 'Unknown',
        call_type: call.call_type || 'Unknown',
        call_status: call.call_status || 'Unknown',
        timestamp: call.start_time || call.created_at,
        duration: duration,
        recording_url: call.recording_url,
        transcript: call.transcript,
        summary: call.summary
      }
    })

    return NextResponse.json(recentCalls)
  } catch (error) {
    console.error('Error in recent calls API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
