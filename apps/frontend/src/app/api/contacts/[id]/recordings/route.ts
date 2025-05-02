import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // First, try to get audio files from the contact record
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('contact_id', contactId)
      .single()

    if (contactError && contactError.code !== 'PGRST116') {
      console.error('Error fetching contact:', contactError)
    }

    // Define interface for audio file structure
    interface AudioFile {
      call_id?: string;
      timestamp?: string;
      url: string;
    }

    interface Recording {
      id: string;
      call_id: string;
      timestamp: string;
      duration: number;
      url: string;
      call_type: string;
      call_status: string;
      transcript: string | null;
      summary: string | null;
    }

    // Extract audio files from contact if available
    let audioFilesFromContact: Recording[] = []
    if (contact?.audio_files && Array.isArray(contact.audio_files)) {
      audioFilesFromContact = contact.audio_files.map((audio: AudioFile) => ({
        id: audio.call_id || `audio-${Math.random().toString(36).substring(2, 9)}`,
        call_id: audio.call_id || '',
        timestamp: audio.timestamp || new Date().toISOString(),
        duration: 0, // Duration is unknown from contact record
        url: audio.url,
        call_type: 'Unknown', // Type is unknown from contact record
        call_status: 'Completed', // Status is unknown from contact record
        transcript: null,
        summary: null
      }))
    }

    // Get all calls for this contact
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('contact_id', contactId)
      .order('start_time', { ascending: false })

    // Log the number of calls found
    console.log(`Found ${calls?.length || 0} calls for contact ${contactId}`)

    if (callsError) {
      console.error('Error fetching calls:', callsError)

      // If we have audio files from the contact, return those even if calls fetch failed
      if (audioFilesFromContact.length > 0) {
        return NextResponse.json({
          success: true,
          recordings: audioFilesFromContact
        })
      }

      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: 500 }
      )
    }

    // Filter calls that have recording URLs
    const callsWithRecordings = calls.filter(
      call => call.recording_url || call.audio_url
    )

    // For calls without recordings, check metadata
    const callsToCheck = calls.filter(
      call => !call.recording_url && !call.audio_url && call.call_id
    )

    // Check if any calls have recording URLs in their metadata
    const callsWithMetadataRecordings = callsToCheck.map(call => {
      try {
        // Check if the call has a recording URL in its metadata
        if (call.metadata && typeof call.metadata === 'object') {
          interface CallMetadata {
            recordingUrl?: string;
            recording_url?: string;
            stereoRecordingUrl?: string;
            artifact?: {
              recordingUrl?: string;
              recording_url?: string;
              stereoRecordingUrl?: string;
            };
          }

          const metadata = call.metadata as Record<string, unknown> as CallMetadata

          // Check for recording URL in various possible metadata fields
          const recordingUrl =
            metadata.recordingUrl ||
            metadata.recording_url ||
            metadata.stereoRecordingUrl ||
            (metadata.artifact?.recordingUrl) ||
            (metadata.artifact?.recording_url) ||
            (metadata.artifact?.stereoRecordingUrl) ||
            null

          if (recordingUrl) {
            console.log(`Found recording URL in metadata for call ${call.call_id}: ${recordingUrl}`)

            // Update the call with the recording URL
            const updatedCall = {
              ...call,
              recording_url: recordingUrl
            }

            // Update the database with the recording URL
            supabase
              .from('calls')
              .update({ recording_url: recordingUrl })
              .eq('call_id', call.call_id)
              .then(() => console.log(`Updated recording URL in database for call ${call.call_id}`))
              .catch(err => console.error(`Error updating recording URL in database: ${err}`))

            return updatedCall
          }
        }

        // If no recording URL found in metadata, return the call as is
        return call
      } catch (error) {
        console.error(`Error processing metadata for call ${call.call_id}:`, error)
        return call
      }
    })

    // Combine calls that already had recordings with newly found ones that have recordings
    const allCallsWithRecordings = [
      ...callsWithRecordings,
      ...callsWithMetadataRecordings.filter(call => call.recording_url || call.audio_url)
    ]

    // Format the response from calls
    const recordingsFromCalls = allCallsWithRecordings.map(call => ({
      id: call.id || call.call_id || `call-${Math.random().toString(36).substring(2, 9)}`,
      call_id: call.call_id || call.id || '',
      timestamp: call.start_time || call.timestamp || call.created_at || new Date().toISOString(),
      duration: call.call_duration || call.duration || 0,
      url: call.recording_url || call.audio_url || '',
      call_type: call.call_type || call.type || 'Unknown',
      call_status: call.call_status || call.status || 'Unknown',
      transcript: call.transcript || null,
      summary: call.summary || null
    }))

    // Combine recordings from calls and from contact
    const allRecordings = [...recordingsFromCalls, ...audioFilesFromContact]

    // Remove duplicates based on URL
    const uniqueRecordings = allRecordings.filter((recording, index, self) =>
      recording.url && self.findIndex(r => r.url === recording.url) === index
    )

    // Sort by timestamp (newest first)
    const sortedRecordings = uniqueRecordings.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json({
      success: true,
      recordings: sortedRecordings
    })
  } catch (error) {
    console.error('Error fetching recordings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    )
  }
}
