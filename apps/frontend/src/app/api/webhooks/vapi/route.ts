import { NextResponse } from 'next/server'
import { supabase } from '@/lib/services/supabase'
import { vapiService } from '@/lib/services/vapi'
import crypto from 'node:crypto'

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
 *
 * New format events (2025):
 * - status-update: When a call status changes (in-progress, ended)
 * - end-of-call-report: When a call is completed with full report
 */
export async function POST(req: Request) {
  try {
    // Check if request body is empty
    const text = await req.text()
    if (!text || text.trim() === '') {
      console.error('Empty webhook payload')
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 })
    }

    // Parse JSON
    let body: Record<string, any>
    try {
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('Invalid JSON in webhook payload:', parseError)
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('Received VAPI webhook:', body)

    // Log the webhook event to our call logs system
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/api/calls/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Received webhook: ${body.event || body.message?.type || 'unknown'} for call ${body.call_id || body.message?.call?.id || 'unknown'}`,
          level: 'info',
          timestamp: new Date().toISOString()
        })
      })
    } catch (logError) {
      console.error('Error logging webhook event:', logError)
    }

    // Check for new format (2025)
    if (body.message && (body.message.type === 'status-update' || body.message.type === 'end-of-call-report')) {
      return handleNewFormatWebhook(body)
    }

    // Legacy format handling
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

    // Extract structured data
    const structuredData = data.structuredData
    const meetingBooked = structuredData.meetingBooked === true
    const meetingTime = structuredData.meetingTime
    const callOutcome = meetingBooked ? 'successful' : (structuredData.callBackLater ? 'call_back_later' : (structuredData.notInterested ? 'not_interested' : 'answered'))

    // Get the call record to find the phone number and other details
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', call_id)
      .single()

    if (callError) {
      console.error(`Error fetching call data for ${call_id}:`, callError)
      throw callError
    }

    const phoneNumber = callData?.phone_number
    if (!phoneNumber) {
      console.warn(`No phone number found for call ${call_id}`)
    }

    // Update the call record
    const updateData: any = {
      metadata: {
        ...data,
        structuredData: structuredData
      },
      updated_at: new Date().toISOString()
    }

    // If a meeting was booked, update the call status
    if (meetingBooked) {
      updateData.call_status = 'Meeting Booked'
      updateData.meeting_scheduled = true
      updateData.meeting_time = meetingTime
    } else {
      updateData.call_status = callOutcome
    }

    const { error } = await supabase
      .from('calls')
      .update(updateData)
      .eq('call_id', call_id)

    if (error) {
      console.error('Error storing analysis data:', error)
      throw error
    }

    // Update the lead profile if phone number exists
    if (phoneNumber) {
      // First check if lead exists in leads table
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, name, email, status, property_interest, budget, location, nationality, notes')
        .eq('phone', phoneNumber)
        .maybeSingle()

      if (leadError) {
        console.error(`Error fetching lead data for ${phoneNumber}:`, leadError)
      }

      let leadId: string
      let leadStatus: string = 'new'

      // Determine call outcome for our new schema
      let callOutcomeValue = 'No Decision'
      if (meetingBooked) {
        callOutcomeValue = 'Meeting Scheduled'
        leadStatus = 'booked'
      } else if (structuredData.callBackLater) {
        callOutcomeValue = 'Call Back Later'
        leadStatus = 'call_back_later'
      } else if (structuredData.notInterested) {
        callOutcomeValue = 'Not Interested'
        leadStatus = 'not_interested'
      } else if (structuredData.interested) {
        callOutcomeValue = 'Interested'
        leadStatus = 'interested'
      }

      // Update the call with the outcome
      await supabase
        .from('calls')
        .update({
          call_outcome: callOutcomeValue,
          updated_at: new Date().toISOString()
        })
        .eq('call_id', call_id)

      if (leadData) {
        // Update existing lead
        leadId = leadData.id

        const leadUpdateData: any = {
          status: leadStatus,
          updated_at: new Date().toISOString()
        }

        // Extract additional lead information if available
        if (structuredData.name) leadUpdateData.name = structuredData.name
        if (structuredData.email) leadUpdateData.email = structuredData.email
        if (structuredData.budget) leadUpdateData.budget = Number.parseFloat(structuredData.budget)
        if (structuredData.propertyInterest) leadUpdateData.property_interest = structuredData.propertyInterest

        // Combine notes
        let notes = leadData.notes || ''
        if (structuredData.nationality) notes += ` Nationality: ${structuredData.nationality}`
        if (structuredData.investmentType) notes += ` Investment Type: ${structuredData.investmentType}`
        if (structuredData.timeframe) notes += ` Timeframe: ${structuredData.timeframe}`
        if (structuredData.location) notes += ` Preferred Location: ${structuredData.location}`
        if (structuredData.size) notes += ` Size: ${structuredData.size}`
        if (notes.trim()) leadUpdateData.notes = notes.trim()

        const { error: updateLeadError } = await supabase
          .from('leads')
          .update(leadUpdateData)
          .eq('id', leadId)

        if (updateLeadError) {
          console.error(`Error updating lead for ${phoneNumber}:`, updateLeadError)
        } else {
          console.log(`Lead for ${phoneNumber} updated successfully`)
        }
      } else {
        // Create new lead
        const newLead = {
          name: structuredData.name || 'Unknown',
          phone: phoneNumber,
          email: structuredData.email || null,
          status: leadStatus,
          property_interest: structuredData.propertyInterest || null,
          budget: structuredData.budget ? Number.parseFloat(structuredData.budget) : null,
          location: structuredData.location || null,
          nationality: structuredData.nationality || null,
          notes: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Combine notes
        let notes = ''
        if (structuredData.nationality) notes += ` Nationality: ${structuredData.nationality}`
        if (structuredData.investmentType) notes += ` Investment Type: ${structuredData.investmentType}`
        if (structuredData.timeframe) notes += ` Timeframe: ${structuredData.timeframe}`
        if (structuredData.location) notes += ` Preferred Location: ${structuredData.location}`
        if (structuredData.size) notes += ` Size: ${structuredData.size}`
        if (notes.trim()) newLead.notes = notes.trim()

        const { data: insertedLead, error: insertLeadError } = await supabase
          .from('leads')
          .insert([newLead])
          .select()
          .single()

        if (insertLeadError) {
          console.error(`Error creating lead for ${phoneNumber}:`, insertLeadError)
          return
        } else {
          console.log(`New lead for ${phoneNumber} created successfully`)
          leadId = insertedLead.id
        }
      }

      // Now check if lead profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('lead_profiles')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle()

      // Determine interest level
      let interestLevel = 'Medium'
      if (meetingBooked && structuredData.budget && Number.parseFloat(structuredData.budget) > 1000000) {
        interestLevel = 'High'
      } else if (meetingBooked || (structuredData.callBackLater && structuredData.budget)) {
        interestLevel = 'Medium'
      } else if (structuredData.notInterested) {
        interestLevel = 'Low'
      }

      if (profileData) {
        // Update existing profile
        const profileUpdateData: any = {
          total_calls: (profileData.total_calls || 0) + 1,
          last_call_date: new Date().toISOString(),
          last_call_status: callOutcomeValue,
          interest_level: interestLevel,
          updated_at: new Date().toISOString()
        }

        // Update answered/missed calls count
        if (callData.call_status === 'Completed' || callData.call_status === 'Answered') {
          profileUpdateData.answered_calls = (profileData.answered_calls || 0) + 1
        } else if (callData.call_status === 'Missed' || callData.call_status === 'No Answer') {
          profileUpdateData.missed_calls = (profileData.missed_calls || 0) + 1
        }

        // Set callback date if needed
        if (structuredData.callBackLater && structuredData.callBackTime) {
          profileUpdateData.callback_date = new Date(structuredData.callBackTime).toISOString()
        }

        const { error: updateProfileError } = await supabase
          .from('lead_profiles')
          .update(profileUpdateData)
          .eq('id', profileData.id)

        if (updateProfileError) {
          console.error(`Error updating lead profile for ${phoneNumber}:`, updateProfileError)
        } else {
          console.log(`Lead profile for ${phoneNumber} updated successfully`)
        }
      } else {
        // Create new lead profile
        const newProfile = {
          lead_id: leadId,
          phone: phoneNumber,
          first_contact_date: new Date().toISOString(),
          successful_meetings: 0,
          total_calls: 1,
          answered_calls: (callData.call_status === 'Completed' || callData.call_status === 'Answered') ? 1 : 0,
          missed_calls: (callData.call_status === 'Missed' || callData.call_status === 'No Answer') ? 1 : 0,
          last_call_date: new Date().toISOString(),
          last_call_status: callOutcomeValue,
          interest_level: interestLevel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Set callback date if needed
        if (structuredData.callBackLater && structuredData.callBackTime) {
          newProfile.callback_date = new Date(structuredData.callBackTime).toISOString()
        }

        const { error: insertProfileError } = await supabase
          .from('lead_profiles')
          .insert([newProfile])

        if (insertProfileError) {
          console.error(`Error creating lead profile for ${phoneNumber}:`, insertProfileError)
        } else {
          console.log(`New lead profile for ${phoneNumber} created successfully`)
        }
      }

      // If a meeting was booked, create a meeting record
      if (meetingBooked && meetingTime) {
        const meetingData = {
          lead_id: leadId,
          call_id,
          timestamp: new Date(meetingTime).toISOString(),
          location: structuredData.meetingLocation || 'Dubai Office',
          property_type: structuredData.propertyInterest || 'not specified',
          budget: structuredData.budget ? Number.parseFloat(structuredData.budget) : null,
          notes: `Meeting scheduled during call. ${structuredData.meetingNotes || ''}`,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: meetingError } = await supabase
          .from('meetings')
          .insert([meetingData])

        if (meetingError) {
          console.error(`Error creating meeting for lead ${leadData?.lead_id}:`, meetingError)
        } else {
          console.log(`Meeting created successfully for lead ${leadData?.lead_id}`)
        }
      }
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

/**
 * Handle new format webhook (2025)
 */
async function handleNewFormatWebhook(body: any) {
  try {
    const message = body.message;
    const callData = message.call;
    const callId = callData?.id;

    if (!callId) {
      console.error('Missing call ID in new format webhook');
      return NextResponse.json({ error: 'Missing call ID' }, { status: 400 });
    }

    console.log(`Processing new format webhook: ${message.type} for call ${callId}`);

    // Handle different message types
    switch (message.type) {
      case 'status-update':
        await handleNewFormatStatusUpdate(callId, message);
        break;

      case 'end-of-call-report':
        await handleNewFormatEndOfCallReport(callId, message);
        break;

      default:
        console.log(`Unhandled new format message type: ${message.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling new format webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle new format status-update event
 */
async function handleNewFormatStatusUpdate(callId: string, message: any) {
  try {
    const status = message.status;
    const callData = message.call;
    const customerNumber = message.customer?.number;

    // Get current call data to merge metadata properly
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', callId)
      .single();

    if (fetchError) {
      // Call doesn't exist yet, create it
      if (fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('calls')
          .insert({
            call_id: callId,
            phone_number: customerNumber || 'Unknown',
            call_type: callData.type === 'outboundPhoneCall' ? 'Outbound' : 'Inbound',
            call_status: status,
            start_time: new Date().toISOString(),
            metadata: message
          });

        if (insertError) {
          console.error('Error creating call record:', insertError);
        }
      } else {
        console.error(`Error fetching existing call data for ${callId}:`, fetchError);
      }
    } else {
      // Update existing call
      const { error: updateError } = await supabase
        .from('calls')
        .update({
          call_status: status,
          metadata: {
            ...existingCall.metadata,
            ...message,
            status_updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('call_id', callId);

      if (updateError) {
        console.error('Error updating call status:', updateError);
      }
    }

    console.log(`Call ${callId} status updated to ${status} successfully`);
  } catch (error) {
    console.error(`Error handling status-update for ${callId}:`, error);
  }
}

/**
 * Handle new format end-of-call-report event
 */
async function handleNewFormatEndOfCallReport(callId: string, message: any) {
  try {
    const callData = message.call;
    const customerNumber = message.customer?.number;
    const transcript = message.artifact?.transcript || '';
    const recordingUrl = message.recordingUrl || message.stereoRecordingUrl || '';
    const summary = message.summary || message.analysis?.summary || '';
    const durationSeconds = message.durationSeconds ? Math.round(Number(message.durationSeconds)) : 0;
    const cost = message.cost || 0;

    // Check if call exists
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', callId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // Call doesn't exist yet, create it
      const { error: insertError } = await supabase
        .from('calls')
        .insert({
          call_id: callId,
          phone_number: customerNumber || 'Unknown',
          call_type: callData.type === 'outboundPhoneCall' ? 'Outbound' : 'Inbound',
          call_status: 'Completed',
          start_time: message.startedAt || new Date().toISOString(),
          end_time: message.endedAt || new Date().toISOString(),
          call_duration: durationSeconds,
          recording_url: recordingUrl,
          transcript: transcript,
          summary: summary,
          metadata: message
        });

      if (insertError) {
        console.error('Error creating call record:', insertError);
      }
    } else {
      // Update existing call
      const { error: updateError } = await supabase
        .from('calls')
        .update({
          call_status: 'Completed',
          end_time: message.endedAt || new Date().toISOString(),
          call_duration: durationSeconds,
          recording_url: recordingUrl,
          transcript: transcript,
          summary: summary,
          metadata: {
            ...existingCall?.metadata || {},
            ...message
          },
          updated_at: new Date().toISOString()
        })
        .eq('call_id', callId);

      if (updateError) {
        console.error('Error updating call with end-of-call report:', updateError);
      }
    }

    // Check if a lead exists for this phone number
    if (customerNumber) {
      // Check if lead exists in enhanced_leads
      const { data: leadData, error: leadError } = await supabase
        .from('enhanced_leads')
        .select('*')
        .eq('phone_number', customerNumber)
        .maybeSingle()

      if (leadError) {
        console.error(`Error fetching lead data for ${customerNumber}:`, leadError)
      }

      // Extract structured data from the message
      const structuredData = message.analysis?.structuredData || {}

      // Determine call outcome
      const meetingBooked = structuredData.meetingBooked === true
      const meetingTime = structuredData.meetingTime
      const callOutcome = meetingBooked ? 'successful' :
                         (structuredData.callBackLater ? 'call_back_later' :
                         (structuredData.notInterested ? 'not_interested' : 'answered'))

      // Prepare lead data for update or insert
      const leadUpdateData: any = {
        last_call_outcome: callOutcome,
        updated_at: new Date().toISOString()
      }

      // Update lead status based on call outcome
      if (meetingBooked) {
        leadUpdateData.status = 'booked'
      } else if (structuredData.callBackLater) {
        leadUpdateData.status = 'call_back_later'
      } else if (structuredData.notInterested) {
        leadUpdateData.status = 'not_interested'
      }

      // Extract additional lead information if available
      if (structuredData.name) leadUpdateData.name = structuredData.name
      if (structuredData.email) leadUpdateData.email = structuredData.email
      if (structuredData.budget) leadUpdateData.budget = structuredData.budget
      if (structuredData.propertyInterest) leadUpdateData.property_interest = structuredData.propertyInterest
      if (structuredData.nationality) leadUpdateData.notes = `${leadData?.notes || ''} Nationality: ${structuredData.nationality}`.trim()
      if (structuredData.investmentType) leadUpdateData.notes = `${leadUpdateData.notes || leadData?.notes || ''} Investment Type: ${structuredData.investmentType}`.trim()
      if (structuredData.timeframe) leadUpdateData.notes = `${leadUpdateData.notes || leadData?.notes || ''} Timeframe: ${structuredData.timeframe}`.trim()
      if (structuredData.location) leadUpdateData.notes = `${leadUpdateData.notes || leadData?.notes || ''} Preferred Location: ${structuredData.location}`.trim()
      if (structuredData.size) leadUpdateData.notes = `${leadUpdateData.notes || leadData?.notes || ''} Size: ${structuredData.size}`.trim()

      // Determine lead quality based on outcome and budget
      if (meetingBooked && structuredData.budget && Number.parseFloat(structuredData.budget) > 1000000) {
        leadUpdateData.lead_quality = 'Hot'
      } else if (meetingBooked || (structuredData.callBackLater && structuredData.budget)) {
        leadUpdateData.lead_quality = 'Warm'
      } else if (structuredData.notInterested) {
        leadUpdateData.lead_quality = 'Cold'
      }

      // Increment total calls
      leadUpdateData.total_calls = (leadData?.total_calls || 0) + 1

      if (leadData) {
        // Update existing lead
        const { error: updateLeadError } = await supabase
          .from('enhanced_leads')
          .update(leadUpdateData)
          .eq('lead_id', leadData.lead_id)

        if (updateLeadError) {
          console.error(`Error updating lead for ${customerNumber}:`, updateLeadError)
        } else {
          console.log(`Lead profile for ${customerNumber} updated successfully`)
        }
      } else {
        // Create new lead
        leadUpdateData.phone_number = customerNumber
        leadUpdateData.lead_id = crypto.randomUUID()
        leadUpdateData.lead_source = 'VAPI Call'
        leadUpdateData.created_at = new Date().toISOString()

        const { error: insertLeadError } = await supabase
          .from('enhanced_leads')
          .insert([leadUpdateData])

        if (insertLeadError) {
          console.error(`Error creating lead for ${customerNumber}:`, insertLeadError)
        } else {
          console.log(`New lead profile for ${customerNumber} created successfully`)
        }
      }

      // If a meeting was booked, create a meeting record
      if (meetingBooked && meetingTime) {
        const meetingData = {
          meeting_id: crypto.randomUUID(),
          lead_id: leadData?.lead_id || leadUpdateData.lead_id,
          call_id: callId,
          timestamp: new Date(meetingTime).toISOString(),
          location: structuredData.meetingLocation || 'Dubai Office',
          property_type: structuredData.propertyInterest || 'not specified',
          budget: structuredData.budget ? Number.parseFloat(structuredData.budget) : null,
          notes: `Meeting scheduled during call. ${structuredData.meetingNotes || ''}`,
          status: 'scheduled',
          agent_id: message.agent?.id || 'cfaa163c-4a47-471b-a39e-95c12d0cb738',
          agent_name: message.agent?.name || 'Top Loader AI Agent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: meetingError } = await supabase
          .from('meetings')
          .insert([meetingData])

        if (meetingError) {
          console.error(`Error creating meeting for lead ${leadData?.lead_id}:`, meetingError)
        } else {
          console.log(`Meeting created successfully for lead ${leadData?.lead_id}`)
        }
      }
    }

    console.log(`Call ${callId} end-of-call report processed successfully`);
  } catch (error) {
    console.error(`Error handling end-of-call-report for ${callId}:`, error);
  }
}
