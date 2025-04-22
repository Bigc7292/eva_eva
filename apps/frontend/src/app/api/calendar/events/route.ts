import { NextResponse } from 'next/server'
import { calendarService } from '@/lib/services/calendar-service'

export async function GET(request: Request) {
  try {
    // Check if user is authenticated with Google Calendar
    if (!calendarService.isAuthenticated()) {
      console.log('User not authenticated with Google Calendar')
      return NextResponse.json([]) // Return empty array instead of error
    }

    const { searchParams } = new URL(request.url)

    // Get start and end dates from query parameters
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')

    // Default to current month if not provided
    const startDate = startParam
      ? new Date(startParam)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const endDate = endParam
      ? new Date(endParam)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)

    console.log('Fetching calendar events from', startDate.toISOString(), 'to', endDate.toISOString())

    // Get events from Google Calendar
    const events = await calendarService.getMeetings(startDate, endDate)

    // Transform events to match our CalendarEvent interface
    const formattedEvents = events.map(event => {
      // Try to determine event type from summary or description
      let type = 'other'
      if (event.summary?.toLowerCase().includes('follow')) {
        type = 'followup'
      } else if (event.summary?.toLowerCase().includes('call')) {
        type = 'call'
      } else if (
        event.summary?.toLowerCase().includes('meeting') ||
        event.summary?.toLowerCase().includes('property') ||
        event.summary?.toLowerCase().includes('viewing')
      ) {
        type = 'meeting'
      }

      // Determine status
      let status = 'confirmed'
      if (event.status === 'cancelled') {
        status = 'cancelled'
      } else if (event.status === 'tentative') {
        status = 'tentative'
      }

      return {
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location,
        type,
        status
      }
    })

    console.log('Fetched', formattedEvents.length, 'calendar events')
    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    // Return empty array instead of error to avoid breaking the UI
    return NextResponse.json([])
  }
}
