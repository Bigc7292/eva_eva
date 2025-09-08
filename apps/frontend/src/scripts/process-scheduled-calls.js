/**
 * Script to process scheduled calls
 * This script should be run by a cron job every minute to check for scheduled calls
 * that are due and initiate them.
 * 
 * Usage: node process-scheduled-calls.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize VAPI API
const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY
const VAPI_AGENT_ID = process.env.NEXT_PUBLIC_VAPI_AGENT_ID
const VAPI_CALLER_ID = process.env.NEXT_PUBLIC_VAPI_CALLER_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

/**
 * Process scheduled calls
 */
async function processScheduledCalls() {
  try {
    console.log('Processing scheduled calls...')
    
    // Get current time
    const now = new Date()
    
    // Get scheduled calls that are due (scheduled time is in the past but within the last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    const { data: scheduledCalls, error } = await supabase
      .from('scheduled_calls')
      .select('*')
      .eq('status', 'Pending')
      .lt('scheduled_time', now.toISOString())
      .gt('scheduled_time', fiveMinutesAgo)
    
    if (error) {
      console.error('Error fetching scheduled calls:', error)
      return
    }
    
    console.log(`Found ${scheduledCalls?.length || 0} scheduled calls to process`)
    
    // Process each scheduled call
    for (const schedule of scheduledCalls || []) {
      try {
        console.log(`Processing scheduled call: ${schedule.id} to ${schedule.phone_number}`)
        
        // Update status to Processing
        await supabase
          .from('scheduled_calls')
          .update({
            status: 'Processing',
            metadata: {
              ...schedule.metadata,
              processing_started_at: new Date().toISOString()
            }
          })
          .eq('id', schedule.id)
        
        // Initiate call with VAPI
        const callData = {
          to: schedule.phone_number,
          from: VAPI_CALLER_ID,
          agent_id: VAPI_AGENT_ID,
          webhook_url: `${APP_URL}/api/webhooks/vapi`,
          metadata: {
            ...schedule.metadata,
            scheduled_call_id: schedule.id,
            scheduled_time: schedule.scheduled_time,
            lead_id: schedule.lead_id
          }
        }
        
        const response = await fetch('https://api.vapi.ai/call/phone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VAPI_API_KEY}`
          },
          body: JSON.stringify(callData)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`VAPI API error: ${errorData.message || response.statusText}`)
        }
        
        const responseData = await response.json()
        console.log(`Call initiated successfully: ${responseData.id}`)
        
        // Update scheduled call with call ID and status
        await supabase
          .from('scheduled_calls')
          .update({
            status: 'Initiated',
            call_id: responseData.id,
            metadata: {
              ...schedule.metadata,
              vapi_call_id: responseData.id,
              initiated_at: new Date().toISOString()
            }
          })
          .eq('id', schedule.id)
        
        // Create a call record in the calls table
        await supabase
          .from('calls')
          .insert({
            call_id: responseData.id,
            phone_number: schedule.phone_number,
            call_type: 'Outbound',
            call_status: 'Initiated',
            start_time: new Date().toISOString(),
            lead_id: schedule.lead_id,
            metadata: {
              ...schedule.metadata,
              scheduled_call_id: schedule.id,
              scheduled_time: schedule.scheduled_time,
              vapi_call_id: responseData.id
            }
          })
        
        console.log(`Scheduled call ${schedule.id} processed successfully`)
      } catch (error) {
        console.error(`Error processing scheduled call ${schedule.id}:`, error)
        
        // Update status to Failed
        await supabase
          .from('scheduled_calls')
          .update({
            status: 'Failed',
            metadata: {
              ...schedule.metadata,
              error: error.message,
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', schedule.id)
      }
    }
    
    console.log('Finished processing scheduled calls')
  } catch (error) {
    console.error('Error in processScheduledCalls:', error)
  }
}

// Run the script
processScheduledCalls()
  .then(() => {
    console.log('Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
