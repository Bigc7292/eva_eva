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

    return NextResponse.json(data)
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

    // Initiate call with VAPI
    const callData = await vapiService.initiateCall(phoneNumber, metadata)

    // Store call in Supabase
    const { error } = await supabase
      .from('calls')
      .insert({
        call_id: callData.id,
        phone_number: phoneNumber,
        status: 'initiated',
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