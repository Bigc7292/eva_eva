import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { vapiService } from '@/lib/services/vapi'

/**
 * POST /api/webhooks/register
 * Register a webhook URL with VAPI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, events } = body

    if (!url) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      )
    }

    // Register webhook with VAPI
    const result = await vapiService.registerWebhook(url, events)

    return NextResponse.json({
      success: true,
      message: 'Webhook registered successfully',
      result
    })
  } catch (error) {
    console.error('Error registering webhook:', error)
    return NextResponse.json(
      { error: 'Failed to register webhook' },
      { status: 500 }
    )
  }
}
