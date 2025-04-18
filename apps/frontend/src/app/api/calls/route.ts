import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { vapiService } from '@/lib/services/vapi'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/calls
 * Retrieves call history from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Get calls from Supabase
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .order('start_time', { ascending: false })

    if (error) throw error

    // Transform data to match frontend expectations
    const transformedData = data?.map(call => ({
      id: call.id,
      call_id: call.call_id,
      phone_number: call.phone_number || call.customer_phone || '',
      call_type: call.call_type || '',
      call_status: call.status || '',
      start_time: call.start_time,
      end_time: call.end_time,
      call_duration: call.call_duration || 0,
      recording_url: call.recording_url || null,
      transcript: call.transcript || null,
      summary: call.summary || null,
      created_at: call.created_at || call.start_time,
      updated_at: call.updated_at || new Date().toISOString(),
      metadata: call.metadata || {}
    })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Failed to fetch calls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calls
 * Initiates a new call using VAPI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, metadata } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Add caller ID to metadata
    const enhancedMetadata = {
      ...metadata,
      caller_id: process.env.NEXT_PUBLIC_VAPI_CALLER_ID || '+971565401583',
      twilio_number: process.env.NEXT_PUBLIC_VAPI_CALLER_ID || '+971565401583',
      phone_number_id: process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID || 'e65a9e6b-33b7-4711-ad21-90220048e38f'
    }

    // Log the call request
    console.log('Initiating call with:', {
      to: phoneNumber,
      from: process.env.NEXT_PUBLIC_VAPI_CALLER_ID || '+971565401583',
      phone_number_id: process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID || 'e65a9e6b-33b7-4711-ad21-90220048e38f',
      assistant_id: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
      metadata: enhancedMetadata
    })

    // Initiate call with VAPI
    const callData = await vapiService.initiateCall(phoneNumber, enhancedMetadata)

    // Store call in Supabase
    const { error } = await supabase
      .from('calls')
      .insert({
        call_id: callData.id,
        phone_number: phoneNumber,
        status: 'initiated',
        call_status: 'initiated', // Add call_status for frontend compatibility
        call_type: 'Outbound', // Default to outbound for manually initiated calls
        start_time: new Date().toISOString(),
        metadata: metadata || {}
      })

    // Log the result
    console.log('Call data stored in Supabase:', { callData, error })

    if (error) {
      console.error('Error storing call data:', error)
    }

    return NextResponse.json(callData)
  } catch (error) {
    console.error('Failed to create call:', error)
    return NextResponse.json(
      { error: 'Failed to create call' },
      { status: 500 }
    )
  }
}