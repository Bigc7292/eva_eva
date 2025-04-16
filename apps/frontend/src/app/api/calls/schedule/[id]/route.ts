import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/calls/schedule/[id]
 * Get a specific scheduled call
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const { data: schedule, error } = await supabase
      .from('scheduled_calls')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (error) {
      console.error('Error fetching scheduled call:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled call' },
        { status: 500 }
      )
    }

    if (!schedule) {
      return NextResponse.json(
        { error: 'Scheduled call not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule
    })
  } catch (error) {
    console.error('Error in get scheduled call API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calls/schedule/[id]
 * Cancel a scheduled call
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = params.id

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    // First check if the schedule exists
    const { data: schedule, error: fetchError } = await supabase
      .from('scheduled_calls')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching scheduled call:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled call' },
        { status: 500 }
      )
    }

    if (!schedule) {
      return NextResponse.json(
        { error: 'Scheduled call not found' },
        { status: 404 }
      )
    }

    // Update the status to Cancelled
    const { error } = await supabase
      .from('scheduled_calls')
      .update({
        status: 'Cancelled',
        metadata: {
          ...schedule.metadata,
          cancelled_at: new Date().toISOString()
        }
      })
      .eq('id', scheduleId)

    if (error) {
      console.error('Error cancelling scheduled call:', error)
      return NextResponse.json(
        { error: 'Failed to cancel scheduled call' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled call cancelled successfully'
    })
  } catch (error) {
    console.error('Error in cancel scheduled call API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
