import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/alerts
 * Retrieves system alerts and notifications from Supabase
 * Supports filtering by type, read status, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'error', 'warning', 'success', 'info', or null for all
    const readStatus = searchParams.get('read') // 'true', 'false', or null for all
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query
    let query = supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    // Apply filters if provided
    if (type) {
      query = query.eq('type', type)
    }

    if (readStatus !== null) {
      const isRead = readStatus === 'true'
      query = query.eq('read', isRead)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      )
    }

    // Format alerts for frontend
    const formattedAlerts = data.map(alert => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      time: alert.created_at,
      read: alert.read,
      source: alert.source,
      metadata: alert.metadata
    }))

    return NextResponse.json({
      alerts: formattedAlerts,
      total: count || formattedAlerts.length,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error in alerts API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/alerts
 * Creates a new system alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, message, source, metadata } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['error', 'warning', 'success', 'info']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid alert type. Must be one of: error, warning, success, info' },
        { status: 400 }
      )
    }

    // Insert new alert
    const { data, error } = await supabase
      .from('system_alerts')
      .insert({
        type,
        message,
        source,
        metadata,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error creating alert:', error)
      return NextResponse.json(
        { error: 'Failed to create alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alert: data[0]
    })
  } catch (error) {
    console.error('Error in create alert API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
