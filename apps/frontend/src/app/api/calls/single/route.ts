import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { vapiService } from '@/lib/services/vapi'
import { supabase } from '@/lib/services/supabase'

/**
 * POST /api/calls/single
 * Initiates a new single call using VAPI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, leadId, metadata = {} } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Add lead ID to metadata if provided
    const callMetadata = {
      ...metadata,
      ...(leadId && { lead_id: leadId }),
      call_type: 'outbound',
      initiated_at: new Date().toISOString()
    }

    // Initiate call with VAPI
    const callData = await vapiService.initiateCall(phoneNumber, callMetadata)

    // Store call in Supabase
    const { error } = await supabase
      .from('calls')
      .insert({
        call_id: callData.id,
        lead_id: leadId,
        phone_number: phoneNumber,
        call_type: 'Outbound',
        call_status: 'initiated',
        start_time: new Date().toISOString(),
        metadata: callMetadata
      })

    if (error) {
      console.error('Error storing call data:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Call initiated successfully',
      call: callData
    })
  } catch (error) {
    console.error('Error initiating call:', error)
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    )
  }
}
