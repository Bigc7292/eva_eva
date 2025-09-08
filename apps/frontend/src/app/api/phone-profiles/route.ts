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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const interestLevel = searchParams.get('interest')

    let result

    if (search) {
      const profiles = await phoneProfilesService.searchPhoneProfiles(search)
      result = {
        profiles,
        total: profiles.length,
        page: 1,
        limit: profiles.length
      }
    } else if (interestLevel) {
      const profiles = await phoneProfilesService.getPhoneProfilesByInterest(interestLevel)
      result = {
        profiles,
        total: profiles.length,
        page: 1,
        limit: profiles.length
      }
    } else {
      result = await phoneProfilesService.getPhoneProfiles(page, limit)
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching phone profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch phone profiles' },
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

    const body = await request.json()
    const { action, phoneNumber, data } = body

    switch (action) {
      case 'record_interaction':
        const interaction = await phoneProfilesService.recordInteraction({
          phone_number: phoneNumber,
          ...data
        })
        return NextResponse.json({
          success: true,
          data: interaction,
          message: 'Interaction recorded successfully'
        })

      case 'schedule_callback':
        await phoneProfilesService.scheduleCallback(
          phoneNumber,
          data.callbackDate,
          data.notes
        )
        return NextResponse.json({
          success: true,
          message: 'Callback scheduled successfully'
        })

      case 'complete_callback':
        await phoneProfilesService.completeCallback(
          phoneNumber,
          data.outcome,
          data.notes
        )
        return NextResponse.json({
          success: true,
          message: 'Callback completed successfully'
        })

      case 'update_profile':
        const updatedProfile = await phoneProfilesService.upsertPhoneProfile(
          phoneNumber,
          data
        )
        return NextResponse.json({
          success: true,
          data: updatedProfile,
          message: 'Profile updated successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing phone profile request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}