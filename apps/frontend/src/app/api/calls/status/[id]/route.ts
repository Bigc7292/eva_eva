import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { vapiService } from '@/lib/services/vapi'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/calls/status/[id]
 * Get the status of a call by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callId = params.id

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      )
    }

    // First check if we have the call in our database
    const { data: callData, error: dbError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', callId)
      .single()

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('Error fetching call from database:', dbError)
    }

    // Get the latest status from VAPI
    console.log(`Getting call status for ${callId} from VAPI`);
    const vapiCallData = await vapiService.getCallDetails(callId)

    // If we have data in our database, merge it with VAPI data
    const mergedCallData = {
      ...vapiCallData,
      ...(callData && {
        lead_id: callData.lead_id,
        local_status: callData.call_status,
        metadata: callData.metadata
      })
    }

    // Update our database with the latest status from VAPI if needed
    if (callData && vapiCallData.status !== callData.call_status) {
      const { error: updateError } = await supabase
        .from('calls')
        .update({
          call_status: vapiCallData.status,
          end_time: ['completed', 'failed', 'error'].includes(vapiCallData.status)
            ? new Date().toISOString()
            : null,
          metadata: {
            ...callData.metadata,
            vapi_updated_status: vapiCallData.status,
            vapi_updated_at: new Date().toISOString()
          }
        })
        .eq('call_id', callId)

      if (updateError) {
        console.error('Error updating call status in database:', updateError)
      }
    }

    // Get transcript if available and not already in the call data
    if (['completed', 'ended'].includes(vapiCallData.status) && !vapiCallData.transcript) {
      try {
        const transcriptData = await vapiService.getTranscript(callId);
        mergedCallData.transcript = transcriptData?.transcript;
      } catch (transcriptError) {
        console.warn('Could not fetch transcript:', transcriptError);
      }
    }

    // Get recording if available and not already in the call data
    if (['completed', 'ended'].includes(vapiCallData.status) && !vapiCallData.recording_url) {
      try {
        const recordingData = await vapiService.getRecording(callId);
        mergedCallData.recording_url = recordingData?.url;
      } catch (recordingError) {
        console.warn('Could not fetch recording:', recordingError);
      }
    }

    return NextResponse.json({
      success: true,
      call: mergedCallData
    })
  } catch (error) {
    console.error('Error getting call status:', error)
    return NextResponse.json(
      { error: 'Failed to get call status' },
      { status: 500 }
    )
  }
}
