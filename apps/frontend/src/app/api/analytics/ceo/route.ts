import { supabase } from '@/lib/services/supabase'
import { NextResponse } from 'next/server'
import { ceoAnalyticsService } from '@/services/ceo-analytics'

export async function GET(request: Request) {
  try {
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    let dateRange = undefined
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    }

    // Get comprehensive analytics
    const analytics = await ceoAnalyticsService.getComprehensiveAnalytics(dateRange)

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching CEO analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'refresh':
        // Force refresh analytics data
        const refreshedAnalytics = await ceoAnalyticsService.getComprehensiveAnalytics(data?.dateRange)
        return NextResponse.json({
          success: true,
          data: refreshedAnalytics,
          message: 'Analytics refreshed successfully'
        })

      case 'export':
        // Export analytics data
        const exportData = await ceoAnalyticsService.getComprehensiveAnalytics(data?.dateRange)
        return NextResponse.json({
          success: true,
          data: exportData,
          format: data?.format || 'json',
          message: 'Analytics data prepared for export'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing CEO analytics request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}