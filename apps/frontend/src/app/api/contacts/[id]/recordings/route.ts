import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'
import { vapiService } from '@/lib/services/vapi'

/**
 * GET /api/contacts/[id]/recordings
 * Retrieves all audio recordings for a specific contact/lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    // First, get all calls for this contact
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .or(`contact_id.eq.${contactId},lead_id.eq.${contactId}`)
      .order('start_time', { ascending: false })

    if (callsError) {
      console.error('Error fetching calls:', callsError)
      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: 500 }
      )
    }

    // Filter calls that have recording URLs
    const callsWithRecordings = calls.filter(
      call => call.recording_url || call.audio_url
    )

    // For calls without recordings, try to fetch them from Vapi
    const callsToFetch = calls.filter(
      call => !call.recording_url && !call.audio_url && call.call_id
    )

    // Fetch recordings for calls that don't have them yet
    const fetchPromises = callsToFetch.map(async (call) => {
      try {
        // Try to get recording from Vapi
        const recordingData = await vapiService.getRecording(call.call_id)

        if (recordingData?.url) {
          // Update the call record with the recording URL
          const { error: updateError } = await supabase
            .from('calls')
            .update({
              recording_url: recordingData.url,
              audio_url: recordingData.url,
              updated_at: new Date().toISOString()
            })
            .eq('id', call.id)

          if (updateError) {
            console.error(`Error updating recording URL for call ${call.id}:`, updateError)
          }

          // Return the call with the new recording URL
          return {
            ...call,
            recording_url: recordingData.url,
            audio_url: recordingData.url
          }
        }

        return call
      } catch (error) {
        console.error(`Error fetching recording for call ${call.call_id}:`, error)
        return call
      }
    })

    // Wait for all fetch operations to complete
    const fetchedCalls = await Promise.all(fetchPromises)

    // Combine calls that already had recordings with newly fetched ones that have recordings
    const allCallsWithRecordings = [
      ...callsWithRecordings,
      ...fetchedCalls.filter(call => call.recording_url || call.audio_url)
    ]

    // Format the response
    const recordings = allCallsWithRecordings.map(call => ({
      id: call.id,
      call_id: call.call_id,
      timestamp: call.start_time || call.timestamp || call.created_at,
      duration: call.call_duration || call.duration || 0,
      url: call.recording_url || call.audio_url,
      call_type: call.call_type || call.type || 'Unknown',
      call_status: call.call_status || call.status || 'Unknown',
      transcript: call.transcript || null,
      summary: call.summary || null
    }))

    return NextResponse.json({
      success: true,
      recordings
    })
  } catch (error) {
    console.error('Error fetching recordings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    )
  }
}
