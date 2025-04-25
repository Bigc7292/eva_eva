import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'
import { normalizePhoneNumbersInArray } from '@/lib/utils/api-utils'

/**
 * GET /api/calls/history
 * Get call history with pagination, sorting, and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const sort = searchParams.get('sort') || 'start_time'
    const order = searchParams.get('order') || 'desc'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'

    // Calculate pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build query
    let query = supabase
      .from('calls')
      .select('*', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,customer_phone.ilike.%${search}%,call_id.ilike.%${search}%`)
    }

    if (status !== 'all') {
      // Check both status and call_status fields
      query = query.or(`status.ilike.%${status}%,call_status.ilike.%${status}%`)
    }

    if (type !== 'all') {
      // Check both call_type and type fields
      query = query.or(`call_type.ilike.%${type}%,type.ilike.%${type}%`)
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' })

    // Apply pagination
    query = query.range(from, to)

    // Execute query
    const { data: calls, error, count } = await query

    if (error) {
      console.error('Error fetching call history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch call history' },
        { status: 500 }
      )
    }

    // Calculate total pages
    const totalCalls = count || 0
    const totalPages = Math.ceil(totalCalls / pageSize)

    // Transform data to match frontend expectations
    const transformedCalls = calls?.map(call => ({
      id: call.id,
      call_id: call.call_id,
      phone_number: call.phone_number || call.customer_phone || '',
      call_type: call.call_type || call.type || '',
      call_status: call.call_status || call.status || '',
      start_time: call.start_time,
      end_time: call.end_time,
      call_duration: call.call_duration || call.duration || 0,
      recording_url: call.recording_url || null,
      transcript: call.transcript || null,
      summary: call.summary || null,
      created_at: call.created_at || call.start_time,
      updated_at: call.updated_at || new Date().toISOString(),
      metadata: call.metadata || {}
    })) || []

    // Normalize phone numbers in the transformed data
    const normalizedCalls = normalizePhoneNumbersInArray(transformedCalls)

    return NextResponse.json({
      calls: normalizedCalls,
      page,
      pageSize,
      totalPages,
      totalCalls
    })
  } catch (error) {
    console.error('Error in call history API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
