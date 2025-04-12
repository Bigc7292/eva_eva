import { NextResponse } from 'next/server'
import { supabase } from '@/lib/services/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { call_id, event, data } = body

    // Update call status in database
    const { error } = await supabase
      .from('calls')
      .update({
        status: event,
        duration: data?.duration,
        audio_url: data?.recording_url
      })
      .eq('call_id', call_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
} 