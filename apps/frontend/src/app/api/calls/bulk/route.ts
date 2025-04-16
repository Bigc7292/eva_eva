import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { vapiService } from '@/lib/services/vapi'
import { supabase } from '@/lib/services/supabase'

/**
 * POST /api/calls/bulk
 * Initiates bulk calls using VAPI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumbers, metadata = {} } = body

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Valid phone numbers array is required' },
        { status: 400 }
      )
    }

    // Add common metadata
    const callMetadata = {
      ...metadata,
      call_type: 'outbound',
      bulk_call: true,
      manual_entry: true,
      initiated_at: new Date().toISOString()
    }

    // Validate phone numbers
    const validatedNumbers = phoneNumbers.map(number => {
      try {
        return vapiService.formatPhoneNumber(number.trim());
      } catch (e) {
        console.warn(`Invalid phone number format: ${number}`);
        return null;
      }
    }).filter(Boolean) as string[];

    if (validatedNumbers.length === 0) {
      return NextResponse.json(
        { error: 'No valid phone numbers provided' },
        { status: 400 }
      )
    }

    // Initiate bulk calls with VAPI
    const bulkCallResult = await vapiService.initiateBulkCalls(
      validatedNumbers,
      callMetadata
    )

    // Store successful calls in Supabase
    if (bulkCallResult.successful.length > 0) {
      const callsToInsert = bulkCallResult.successful.map(call => ({
        call_id: call.id,
        phone_number: call.to || '',
        call_type: 'Outbound',
        call_status: 'initiated',
        start_time: new Date().toISOString(),
        metadata: {
          ...callMetadata,
          vapi_call_id: call.id
        }
      }))

      const { error } = await supabase
        .from('calls')
        .insert(callsToInsert)

      if (error) {
        console.error('Error storing bulk call data:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Initiated ${bulkCallResult.successCount} calls successfully, ${bulkCallResult.failureCount} failed`,
      result: bulkCallResult
    })
  } catch (error) {
    console.error('Error initiating bulk calls:', error)
    return NextResponse.json(
      { error: 'Failed to initiate bulk calls' },
      { status: 500 }
    )
  }
}
