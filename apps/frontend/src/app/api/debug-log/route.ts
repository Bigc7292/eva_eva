import { NextResponse } from 'next/server'

// Simple in-memory log storage
const logs: any[] = []

export async function GET() {
  return NextResponse.json({ logs })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Add timestamp if not provided
    if (!body.timestamp) {
      body.timestamp = new Date().toISOString()
    }
    
    // Add to logs
    logs.push(body)
    
    // Keep only the last 1000 logs
    if (logs.length > 1000) {
      logs.shift()
    }
    
    return NextResponse.json({ success: true, logCount: logs.length })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to log message', details: String(error) },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  // Clear logs
  logs.length = 0
  return NextResponse.json({ success: true, message: 'Logs cleared' })
}
