import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * PATCH /api/alerts/[id]
 * Updates an alert (mark as read/unread)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { read } = body

    if (read === undefined) {
      return NextResponse.json(
        { error: 'Read status is required' },
        { status: 400 }
      )
    }

    // Update alert
    const { data, error } = await supabase
      .from('system_alerts')
      .update({
        read,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating alert:', error)
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      alert: data[0]
    })
  } catch (error) {
    console.error('Error in update alert API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/alerts/[id]
 * Deletes an alert
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete alert
    const { error } = await supabase
      .from('system_alerts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting alert:', error)
      return NextResponse.json(
        { error: 'Failed to delete alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully'
    })
  } catch (error) {
    console.error('Error in delete alert API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
