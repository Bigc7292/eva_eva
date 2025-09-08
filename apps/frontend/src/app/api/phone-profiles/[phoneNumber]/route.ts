import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { phoneProfilesService } from '@/services/phone-profiles'

export async function GET(
  request: Request,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const phoneNumber = decodeURIComponent(params.phoneNumber)
    
    // Get phone profile
    const profile = await phoneProfilesService.getPhoneProfile(phoneNumber)
    
    if (!profile) {
      return NextResponse.json({ error: 'Phone profile not found' }, { status: 404 })
    }

    // Get interactions
    const interactions = await phoneProfilesService.getPhoneInteractions(phoneNumber)

    return NextResponse.json({
      success: true,
      data: {
        profile,
        interactions
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching phone profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch phone profile' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const phoneNumber = decodeURIComponent(params.phoneNumber)
    const updates = await request.json()

    // Update phone profile
    const updatedProfile = await phoneProfilesService.upsertPhoneProfile(
      phoneNumber,
      updates
    )

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Phone profile updated successfully'
    })

  } catch (error) {
    console.error('Error updating phone profile:', error)
    return NextResponse.json(
      { error: 'Failed to update phone profile' },
      { status: 500 }
    )
  }
}