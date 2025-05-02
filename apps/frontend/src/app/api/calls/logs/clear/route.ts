import { NextResponse } from 'next/server'

// Reference to the call logs array in the parent module
// This is a hack to access the same array across different API routes
// In a production environment, you would use a proper database or Redis
let callLogs: string[] = []
try {
  // Try to get the callLogs from the parent module
  const logsModule = require('../route')
  callLogs = logsModule.callLogs
} catch (error) {
  console.error('Error accessing call logs:', error)
}

/**
 * POST /api/calls/logs/clear
 * Clears all call logs
 */
export async function POST() {
  try {
    // Clear the logs array
    callLogs.length = 0
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing call logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
