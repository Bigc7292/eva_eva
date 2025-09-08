import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/calls/schedule
 * Schedule a call for a future time
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, leadId, scheduledTime, metadata = {} } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!scheduledTime) {
      return NextResponse.json(
        { error: 'Scheduled time is required' },
        { status: 400 }
      )
    }

    // Validate that scheduled time is in the future
    const scheduledDate = new Date(scheduledTime)
    const now = new Date()
    
    if (scheduledDate <= now) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Create a unique ID for the schedule
    const scheduleId = uuidv4()

    // Store the schedule in Supabase
    const { data: schedule, error } = await supabase
      .from('scheduled_calls')
      .insert({
        id: scheduleId,
        phone_number: phoneNumber,
        lead_id: leadId || null,
        scheduled_time: scheduledTime,
        status: 'Pending',
        metadata: {
          ...metadata,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error scheduling call:', error)
      return NextResponse.json(
        { error: 'Failed to schedule call' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Call scheduled successfully for ${new Date(scheduledTime).toLocaleString()}`,
      schedule
    })
  } catch (error) {
    console.error('Error in schedule call API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/calls/schedule
 * Get all scheduled calls
 */
export async function GET() {
  try {
    // Get all scheduled calls that are in the future
    const now = new Date().toISOString()
    
    const { data: scheduledCalls, error } = await supabase
      .from('scheduled_calls')
      .select('*')
      .gt('scheduled_time', now)
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Error fetching scheduled calls:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled calls' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scheduledCalls: scheduledCalls || []
    })
  } catch (error) {
    console.error('Error in get scheduled calls API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
