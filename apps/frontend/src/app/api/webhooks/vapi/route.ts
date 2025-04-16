import { NextResponse } from 'next/server'
import { supabase } from '@/lib/services/supabase'
import { vapiService } from '@/lib/services/vapi'

/**
 * VAPI Webhook Handler
 * Processes webhook events from VAPI.ai
 * This is the primary entry point for call data in the system
 *
 * Supported events:
 * - call.started: When a call is initiated
 * - call.ended: When a call is completed
 * - call.status_updated: When a call status changes
 * - transcript.created: When a transcript is available
 * - recording.created: When a recording is available
 * - summary.created: When a summary is available
 * - analysis.created: When structured data is available
 * - call.failed: When a call fails
 * - call.ringing: When a call is ringing
 * - call.answered: When a call is answered
 * - call.in_progress: When a call is in progress
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Received VAPI webhook:', body)

    // Extract relevant data from the webhook
    const { call_id, event, data } = body

    if (!call_id) {
      console.error('Missing call_id in webhook payload')
      return NextResponse.json({ error: 'Missing call_id' }, { status: 400 })
    }

    // Log the webhook event for debugging
    console.log(`Processing VAPI webhook event: ${event} for call ${call_id}`)

    // Process different event types
    switch (event) {
      case 'call.started':
        // New call started
        await handleCallStarted(call_id, data)
        break

      case 'call.ended':
        // Call ended
        await handleCallEnded(call_id, data)
        break

      case 'transcript.created':
        // New transcript available
        await handleTranscriptCreated(call_id, data)
        break

      case 'recording.created':
        // New recording available
        await handleRecordingCreated(call_id, data)
        break

      case 'summary.created':
        // New summary available
        await handleSummaryCreated(call_id, data)
        break

      case 'analysis.created':
        // New structured data available
        await handleAnalysisCreated(call_id, data)
        break

      case 'call.status_updated':
        // Call status updated
        await handleCallStatusUpdated(call_id, data)
        break

      case 'call.failed':
        // Call failed
        await handleCallFailed(call_id, data)
        break

      case 'call.ringing':
        // Call is ringing
        await handleCallRinging(call_id, data)
        break

      case 'call.answered':
        // Call was answered
        await handleCallAnswered(call_id, data)
        break

      case 'call.in_progress':
        // Call is in progress
        await handleCallInProgress(call_id, data)
        break

      default:
        console.log(`Unhandled event type: ${event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('VAPI webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle call.started event
 */
async function handleCallStarted(call_id: string, data: any) {
  try {
    // Get the phone number from the data
    const phoneNumber = data?.to || 'Unknown'
    const direction = data?.direction || (data?.from ? 'inbound' : 'outbound')
    const callType = direction === 'inbound' ? 'Inbound' : 'Outbound'

    const { error } = await supabase
      .from('calls')
      .upsert({
        call_id,
        phone_number: phoneNumber,
        call_type: callType,
        call_status: 'started',
        start_time: new Date().toISOString(),
        metadata: data || {}
      }, { onConflict: 'call_id' })

    if (error) {
      console.error('Error storing call start data:', error)
      throw error
    }

    console.log(`Call ${call_id} started data stored successfully`)
  } catch (error) {
    console.error(`Error handling call.started for ${call_id}:`, error)
  }
}

/**
 * Handle call.ended event
 */
async function handleCallEnded(call_id: string, data: any) {
  try {
    const { error } = await supabase
      .from('calls')
      .update({
        call_status: 'Completed',
        end_time: new Date().toISOString(),
        call_duration: data?.duration,
        recording_url: data?.recording_url,
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error storing call end data:', error)
      throw error
    }

    // Try to fetch additional call data if available
    try {
      const callDetails = await vapiService.getCallDetails(call_id)
      if (callDetails) {
        // Update with any additional data
        await supabase
          .from('calls')
          .update({
            transcript: callDetails.artifact?.transcript,
            summary: callDetails.analysis?.summary,
            metadata: {
              ...data,
              ...callDetails
            },
            updated_at: new Date().toISOString()
          })
          .eq('call_id', call_id)
      }
    } catch (detailsError) {
      console.error(`Error fetching additional call details for ${call_id}:`, detailsError)
    }

    console.log(`Call ${call_id} ended data stored successfully`)
  } catch (error) {
    console.error(`Error handling call.ended for ${call_id}:`, error)
  }
}

/**
 * Handle transcript.created event
 */
async function handleTranscriptCreated(call_id: string, data: any) {
  try {
    if (!data?.transcript) {
      console.warn(`No transcript data for call ${call_id}`)
      return
    }

    // Store in transcripts table
    const { error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        call_id,
        transcript: data.transcript,
        timestamp: new Date().toISOString()
      })

    if (transcriptError) {
      console.error('Error storing transcript data:', transcriptError)
      throw transcriptError
    }

    // Update the call record with the transcript
    const { error: callError } = await supabase
      .from('calls')
      .update({
        transcript: data.transcript,
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (callError) {
      console.error('Error updating call with transcript:', callError)
    }

    console.log(`Transcript for call ${call_id} stored successfully`)
  } catch (error) {
    console.error(`Error handling transcript.created for ${call_id}:`, error)
  }
}

/**
 * Handle recording.created event
 */
async function handleRecordingCreated(call_id: string, data: any) {
  try {
    if (!data?.recording_url) {
      console.warn(`No recording URL for call ${call_id}`)
      return
    }

    const { error } = await supabase
      .from('calls')
      .update({
        recording_url: data.recording_url,
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error storing recording data:', error)
      throw error
    }

    console.log(`Recording for call ${call_id} stored successfully`)
  } catch (error) {
    console.error(`Error handling recording.created for ${call_id}:`, error)
  }
}

/**
 * Handle summary.created event
 */
async function handleSummaryCreated(call_id: string, data: any) {
  try {
    if (!data?.summary) {
      console.warn(`No summary data for call ${call_id}`)
      return
    }

    const { error } = await supabase
      .from('calls')
      .update({
        summary: data.summary,
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error storing summary data:', error)
      throw error
    }

    console.log(`Summary for call ${call_id} stored successfully`)
  } catch (error) {
    console.error(`Error handling summary.created for ${call_id}:`, error)
  }
}

/**
 * Handle analysis.created event
 */
async function handleAnalysisCreated(call_id: string, data: any) {
  try {
    if (!data?.structuredData) {
      console.warn(`No structured data for call ${call_id}`)
      return
    }

    // Check if a meeting was booked
    const meetingBooked = data.structuredData.meetingBooked === true
    const meetingTime = data.structuredData.meetingTime

    const updateData: any = {
      metadata: {
        ...data,
        structuredData: data.structuredData
      },
      updated_at: new Date().toISOString()
    }

    // If a meeting was booked, update the call status
    if (meetingBooked) {
      updateData.call_status = 'Meeting Booked'
      updateData.meeting_scheduled = true
      updateData.meeting_time = meetingTime
    }

    const { error } = await supabase
      .from('calls')
      .update(updateData)
      .eq('call_id', call_id)

    if (error) {
      console.error('Error storing analysis data:', error)
      throw error
    }

    console.log(`Analysis for call ${call_id} stored successfully`)
  } catch (error) {
    console.error(`Error handling analysis.created for ${call_id}:`, error)
  }
}

/**
 * Handle call.status_updated event
 */
async function handleCallStatusUpdated(call_id: string, data: any) {
  try {
    // Get current call data to merge metadata properly
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('metadata')
      .eq('call_id', call_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching existing call data for ${call_id}:`, fetchError)
    }

    const existingMetadata = existingCall?.metadata || {}

    const { error } = await supabase
      .from('calls')
      .update({
        call_status: data?.status || 'Unknown',
        metadata: {
          ...existingMetadata,
          ...data,
          status_updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error updating call status:', error)
      throw error
    }

    console.log(`Call ${call_id} status updated successfully`)
  } catch (error) {
    console.error(`Error handling call.status_updated for ${call_id}:`, error)
  }
}

/**
 * Handle call.failed event
 */
async function handleCallFailed(call_id: string, data: any) {
  try {
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('metadata')
      .eq('call_id', call_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching existing call data for ${call_id}:`, fetchError)
    }

    const existingMetadata = existingCall?.metadata || {}

    const { error } = await supabase
      .from('calls')
      .update({
        call_status: 'Failed',
        end_time: new Date().toISOString(),
        metadata: {
          ...existingMetadata,
          ...data,
          failure_reason: data?.reason || 'Unknown failure',
          failed_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error updating call failure data:', error)
      throw error
    }

    console.log(`Call ${call_id} failure data stored successfully`)
  } catch (error) {
    console.error(`Error handling call.failed for ${call_id}:`, error)
  }
}

/**
 * Handle call.ringing event
 */
async function handleCallRinging(call_id: string, data: any) {
  try {
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('metadata')
      .eq('call_id', call_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching existing call data for ${call_id}:`, fetchError)
    }

    const existingMetadata = existingCall?.metadata || {}

    const { error } = await supabase
      .from('calls')
      .update({
        call_status: 'Ringing',
        metadata: {
          ...existingMetadata,
          ...data,
          ringing_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error updating call ringing data:', error)
      throw error
    }

    console.log(`Call ${call_id} ringing data stored successfully`)
  } catch (error) {
    console.error(`Error handling call.ringing for ${call_id}:`, error)
  }
}

/**
 * Handle call.answered event
 */
async function handleCallAnswered(call_id: string, data: any) {
  try {
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('metadata')
      .eq('call_id', call_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching existing call data for ${call_id}:`, fetchError)
    }

    const existingMetadata = existingCall?.metadata || {}

    const { error } = await supabase
      .from('calls')
      .update({
        call_status: 'Answered',
        metadata: {
          ...existingMetadata,
          ...data,
          answered_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error updating call answered data:', error)
      throw error
    }

    console.log(`Call ${call_id} answered data stored successfully`)
  } catch (error) {
    console.error(`Error handling call.answered for ${call_id}:`, error)
  }
}

/**
 * Handle call.in_progress event
 */
async function handleCallInProgress(call_id: string, data: any) {
  try {
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('metadata')
      .eq('call_id', call_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching existing call data for ${call_id}:`, fetchError)
    }

    const existingMetadata = existingCall?.metadata || {}

    const { error } = await supabase
      .from('calls')
      .update({
        call_status: 'In Progress',
        metadata: {
          ...existingMetadata,
          ...data,
          in_progress_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error updating call in progress data:', error)
      throw error
    }

    console.log(`Call ${call_id} in progress data stored successfully`)
  } catch (error) {
    console.error(`Error handling call.in_progress for ${call_id}:`, error)
  }
}
