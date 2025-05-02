import { NextResponse } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/calls/active
 * Returns a list of active calls
 */
export async function GET() {
  try {
    // Get active calls from the database
    // Active calls are those with status 'In Progress', 'Ringing', 'Answered', or 'started'
    const { data, error } = await supabase
      .from('calls')
      .select('*, contacts(name, phone_number)')
      .or('call_status.eq.In Progress,call_status.eq.Ringing,call_status.eq.Answered,call_status.eq.started')
      .order('start_time', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching active calls:', error)
      return NextResponse.json({ error: 'Failed to fetch active calls' }, { status: 500 })
    }

    // Transform the data for the frontend
    const activeCalls = data.map(call => {
      // Calculate duration in seconds
      const startTime = new Date(call.start_time)
      const now = new Date()
      const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)

      // Extract transcript if available
      let transcript: string[] = []
      if (call.transcript) {
        // If transcript is a string, split it into lines
        if (typeof call.transcript === 'string') {
          transcript = call.transcript.split('\n').filter(line => line.trim() !== '')
        }
      }

      return {
        id: call.id || call.call_id,
        call_id: call.call_id,
        phone_number: call.phone_number || 'Unknown',
        status: call.call_status || 'In Progress',
        startTime: call.start_time,
        duration: durationSeconds,
        transcript: transcript
      }
    })

    return NextResponse.json(activeCalls)
  } catch (error) {
    console.error('Error in active calls API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
