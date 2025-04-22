import { NextResponse } from 'next/server'
import { calendarService } from '@/lib/services/calendar-service'

export async function GET() {
  try {
    // Get start and end dates for sync (default to last 30 days and next 90 days)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30) // 30 days ago
    
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 90) // 90 days in the future
    
    // Sync calendar events with database
    const result = await calendarService.syncCalendarWithDatabase(startDate, endDate)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error syncing calendar:', error)
    return NextResponse.json(
      { error: 'Failed to sync calendar events' },
      { status: 500 }
    )
  }
}
