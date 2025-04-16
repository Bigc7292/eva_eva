import { NextResponse } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * VAPI Webhook Handler
 * Processes webhook events from VAPI.ai
 * This is the primary entry point for call data in the system
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

      case 'call.status_updated':
        // Call status updated
        await handleCallStatusUpdated(call_id, data)
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

    const { error } = await supabase
      .from('calls')
      .upsert({
        call_id,
        phone_number: phoneNumber,
        status: 'started',
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
        status: 'ended',
        end_time: new Date().toISOString(),
        duration: data?.duration,
        recording_url: data?.recording_url
      })
      .eq('call_id', call_id)

    if (error) {
      console.error('Error storing call end data:', error)
      throw error
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

    const { error } = await supabase
      .from('transcripts')
      .insert({
        call_id,
        transcript: data.transcript,
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('Error storing transcript data:', error)
      throw error
    }

    console.log(`Transcript for call ${call_id} stored successfully`)
  } catch (error) {
    console.error(`Error handling transcript.created for ${call_id}:`, error)
  }
}

/**
 * Handle call.status_updated event
 */
async function handleCallStatusUpdated(call_id: string, data: any) {
  try {
    const { error } = await supabase
      .from('calls')
      .update({
        status: data?.status || 'unknown',
        metadata: data || {}
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
