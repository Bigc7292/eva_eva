import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/calendar/available_slots
 * Get available calendar slots based on a requested time
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const requestedTime = searchParams.get('time') || ''
    
    if (!requestedTime) {
      return NextResponse.json(
        { error: 'Requested time is required' },
        { status: 400 }
      )
    }
    
    console.log('Searching for available slots around:', requestedTime)
    
    // Parse the requested time
    let targetDate: Date
    try {
      // Handle various time formats
      if (requestedTime.toLowerCase().includes('tomorrow')) {
        targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + 1)
      } else if (requestedTime.toLowerCase().includes('next week')) {
        targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + 7)
      } else if (requestedTime.toLowerCase().includes('weekend')) {
        targetDate = new Date()
        // Find the next Saturday
        const daysUntilWeekend = (6 - targetDate.getDay() + 7) % 7
        targetDate.setDate(targetDate.getDate() + daysUntilWeekend)
      } else {
        // Try to parse as a date string
        targetDate = new Date(requestedTime)
      }
      
      // Check if the date is valid
      if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date format')
      }
    } catch (error) {
      console.error('Error parsing requested time:', error)
      return NextResponse.json(
        { error: 'Invalid time format' },
        { status: 400 }
      )
    }
    
    // Set the target date to midnight
    targetDate.setHours(0, 0, 0, 0)
    
    // Get the next day
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)
    
    // Check for existing meetings on the target date
    const { data: existingMeetings, error } = await supabase
      .from('meetings')
      .select('timestamp')
      .gte('timestamp', targetDate.toISOString())
      .lt('timestamp', nextDay.toISOString())
    
    if (error) {
      console.error('Error fetching existing meetings:', error)
      // For demo purposes, continue with mock data
    }
    
    // Generate available time slots (9 AM to 5 PM, hourly)
    const availableSlots = []
    const bookedTimes = new Set()
    
    // Add existing meeting times to booked set
    if (existingMeetings) {
      existingMeetings.forEach(meeting => {
        const meetingTime = new Date(meeting.timestamp)
        bookedTimes.add(meetingTime.getHours())
      })
    }
    
    // Business hours: 9 AM to 5 PM
    for (let hour = 9; hour <= 17; hour++) {
      // Skip if the hour is already booked
      if (bookedTimes.has(hour)) {
        continue
      }
      
      const slotDate = new Date(targetDate)
      slotDate.setHours(hour, 0, 0, 0)
      
      // Format the time slot
      const formattedDate = slotDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
      
      const formattedTime = slotDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      
      availableSlots.push(`${formattedDate} at ${formattedTime}`)
    }
    
    // If no slots are available on the target date, check the next day
    if (availableSlots.length === 0) {
      const nextDayDate = new Date(targetDate)
      nextDayDate.setDate(nextDayDate.getDate() + 1)
      
      // Format the next day
      const formattedNextDay = nextDayDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
      
      // Add some slots for the next day
      for (let hour = 9; hour <= 17; hour += 2) {
        const formattedTime = new Date(nextDayDate.setHours(hour, 0, 0, 0))
          .toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        
        availableSlots.push(`${formattedNextDay} at ${formattedTime}`)
      }
    }
    
    return NextResponse.json({
      requested_time: requestedTime,
      target_date: targetDate.toISOString(),
      available_slots: availableSlots
    })
  } catch (error) {
    console.error('Error in available slots API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
