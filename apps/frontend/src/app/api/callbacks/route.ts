import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { phoneProfilesService } from '@/services/phone-profiles'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's callbacks
    const callbacks = await phoneProfilesService.getTodaysCallbacks()

    return NextResponse.json({
      success: true,
      data: callbacks,
      count: callbacks.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching callbacks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch callbacks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phoneNumber, callbackDate, notes } = await request.json()

    if (!phoneNumber || !callbackDate) {
      return NextResponse.json(
        { error: 'Phone number and callback date are required' },
        { status: 400 }
      )
    }

    // Schedule callback
    await phoneProfilesService.scheduleCallback(phoneNumber, callbackDate, notes)

    return NextResponse.json({
      success: true,
      message: 'Callback scheduled successfully'
    })

  } catch (error) {
    console.error('Error scheduling callback:', error)
    return NextResponse.json(
      { error: 'Failed to schedule callback' },
      { status: 500 }
    )
  }
}