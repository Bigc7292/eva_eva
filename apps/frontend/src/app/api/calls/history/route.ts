import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

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
      query = query.ilike('phone_number', `%${search}%`)
    }

    if (status !== 'all') {
      query = query.ilike('call_status', `%${status}%`)
    }

    if (type !== 'all') {
      query = query.ilike('call_type', `%${type}%`)
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

    return NextResponse.json({
      calls: calls || [],
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
