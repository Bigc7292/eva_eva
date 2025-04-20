import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the backend API with RetellAI configuration
    const response = await fetch(`${process.env.BACKEND_URL}/api/calls/outbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`
      },
      body: JSON.stringify({
        ...body,
        webhook_config: {
          webhook_url: process.env.WEBHOOK_URL,
          webhook_auth_key: process.env.RETELL_API_KEY,
          events: [
            'call_started',
            'call_ended',
            'call_analyzed',
            'transcription_update',
            'stream_connected',
            'stream_disconnected'
          ]
        },
        voice_config: {
          voice_id: process.env.RETELL_VOICE_ID || 'sophie',
          stability: 0.5,
          similarity: 0.5,
          use_voice_enhancement: true
        },
        connection_config: {
          sip_domain: process.env.TWILIO_SIP_DOMAIN,
          transport: 'tls',
          timeout_seconds: 60
        },
        recording_enabled: true,
        recording_channels: 'dual',
        debug_mode: process.env.NODE_ENV === 'development'
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to initiate outbound call')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in outbound call:', error)
    return NextResponse.json(
      { error: 'Failed to initiate outbound call' },
      { status: 500 }
    )
  }
}