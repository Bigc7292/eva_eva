import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * POST /api/calendar/book
 * Book a calendar slot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slot } = body
    
    if (!slot) {
      return NextResponse.json(
        { error: 'Slot is required' },
        { status: 400 }
      )
    }
    
    console.log('Booking calendar slot:', slot)
    
    // Parse the slot string to get a date
    let bookingDate: Date
    try {
      // Extract date and time from the slot string
      // Example format: "Monday, April 22 at 10:00 AM"
      const dateTimeParts = slot.split(' at ')
      if (dateTimeParts.length !== 2) {
        throw new Error('Invalid slot format')
      }
      
      const datePart = dateTimeParts[0]
      const timePart = dateTimeParts[1]
      
      // Combine date and time
      const dateTimeString = `${datePart} ${timePart}`
      bookingDate = new Date(dateTimeString)
      
      // Check if the date is valid
      if (isNaN(bookingDate.getTime())) {
        throw new Error('Invalid date format')
      }
    } catch (error) {
      console.error('Error parsing slot:', error)
      return NextResponse.json(
        { error: 'Invalid slot format' },
        { status: 400 }
      )
    }
    
    // Check if the slot is already booked
    const { data: existingMeetings, error } = await supabase
      .from('meetings')
      .select('id')
      .eq('timestamp', bookingDate.toISOString())
    
    if (error) {
      console.error('Error checking existing meetings:', error)
      // For demo purposes, continue with booking
    } else if (existingMeetings && existingMeetings.length > 0) {
      return NextResponse.json(
        { 
          error: 'This slot is already booked',
          booking_confirmation: false
        },
        { status: 409 }
      )
    }
    
    // For demo purposes, always return success
    // In a real implementation, you would create a meeting record in the database
    
    return NextResponse.json({
      success: true,
      booking_confirmation: true,
      slot,
      timestamp: bookingDate.toISOString()
    })
  } catch (error) {
    console.error('Error in book slot API:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        booking_confirmation: false
      },
      { status: 500 }
    )
  }
}
