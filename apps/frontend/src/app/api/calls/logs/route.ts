import { NextResponse } from 'next/server'
import { supabase } from '@/lib/services/supabase'

// In-memory store for call logs
const callLogs: string[] = []
const MAX_LOGS = 100

/**
 * GET /api/calls/logs
 * Returns the call logs
 */
export async function GET() {
  try {
    return NextResponse.json(callLogs)
  } catch (error) {
    console.error('Error in call logs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/calls/logs
 * Adds a new log entry
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, level = 'info', timestamp = new Date().toISOString() } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Format the log entry
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`
    
    // Add to the in-memory store
    callLogs.unshift(logEntry)
    
    // Keep only the most recent logs
    if (callLogs.length > MAX_LOGS) {
      callLogs.pop()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in call logs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
