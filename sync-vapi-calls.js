/**
 * Script to synchronize Vapi call data with the database
 * This script will:
 * 1. Fetch all calls from Vapi
 * 2. Store them in the calls table
 * 3. Update contact profiles with call data
 * 4. Update lead profiles with call data
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Vapi configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Fetch all calls from Vapi with pagination
 * @param {number} limit - Number of calls to fetch per page
 * @param {string} cursor - Cursor for pagination
 * @returns {Promise<Array>} - Array of calls
 */
async function fetchAllCalls(limit = 100, cursor = null) {
  try {
    let url = `${VAPI_API_URL}/call?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    log(`Fetching calls from Vapi: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch calls: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Check if we have more calls to fetch
    const calls = data.calls || [];
    log(`Retrieved ${calls.length} calls from Vapi`);
    
    // If we have a next cursor and calls, fetch the next page
    if (data.next_cursor && calls.length > 0) {
      log(`Found next cursor: ${data.next_cursor}`);
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the next page and combine the results
      const nextCalls = await fetchAllCalls(limit, data.next_cursor);
      return [...calls, ...nextCalls];
    }
    
    return calls;
  } catch (error) {
    log(`Error fetching calls: ${error.message}`);
    return [];
  }
}

/**
 * Fetch call details from Vapi
 * @param {string} callId - The ID of the call
 * @returns {Promise<Object|null>} - Call details or null if error
 */
async function fetchCallDetails(callId) {
  try {
    log(`Fetching details for call ${callId}...`);

    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch call details: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    log(`Successfully retrieved details for call ${callId}`);
    return data;
  } catch (error) {
    log(`Error fetching call details for ${callId}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch call recording from Vapi
 * @param {string} callId - The ID of the call
 * @returns {Promise<string|null>} - Recording URL or null if error
 */
async function fetchCallRecording(callId) {
  try {
    log(`Fetching recording for call ${callId}...`);

    const response = await fetch(`${VAPI_API_URL}/call/${callId}/recording`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`No recording available for call ${callId}: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    log(`Successfully retrieved recording for call ${callId}: ${data.url}`);
    return data.url;
  } catch (error) {
    log(`Error fetching recording for ${callId}: ${error.message}`);
    return null;
  }
}

/**
 * Process a call and store it in the database
 * @param {Object} call - Call data from Vapi
 * @returns {Promise<boolean>} - Success status
 */
async function processCall(call) {
  try {
    log(`Processing call ${call.id}...`);

    // Extract relevant data
    const callId = call.id;
    const phoneNumber = call.customer?.number || call.to || 'Unknown';
    const callType = call.type === 'outboundPhoneCall' ? 'Outbound' : 'Inbound';
    const callStatus = call.status || 'Unknown';
    const startTime = call.startedAt || call.created_at || new Date().toISOString();
    const endTime = call.endedAt || null;
    const duration = call.duration || 0;
    const recordingUrl = call.recordingUrl || call.artifact?.recording || null;
    const transcript = call.artifact?.transcript || null;
    const summary = call.analysis?.summary || null;

    // Check if the call already exists in the database
    const { data: existingCall, error: existingCallError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', callId)
      .maybeSingle();

    if (existingCallError) {
      log(`Error checking if call ${callId} exists: ${existingCallError.message}`);
      return false;
    }

    // Find contact by phone number
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('contact_id, phone_number')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (contactError) {
      log(`Error finding contact for phone ${phoneNumber}: ${contactError.message}`);
    }

    // Find lead by phone number
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, phone')
      .eq('phone', phoneNumber)
      .maybeSingle();

    if (leadError) {
      log(`Error finding lead for phone ${phoneNumber}: ${leadError.message}`);
    }

    // Find enhanced lead by phone number
    const { data: enhancedLead, error: enhancedLeadError } = await supabase
      .from('enhanced_leads')
      .select('lead_id, phone_number')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (enhancedLeadError) {
      log(`Error finding enhanced lead for phone ${phoneNumber}: ${enhancedLeadError.message}`);
    }

    // Prepare call data for upsert
    const callData = {
      call_id: callId,
      phone_number: phoneNumber,
      call_type: callType,
      call_status: callStatus,
      start_time: startTime,
      end_time: endTime,
      call_duration: duration,
      recording_url: recordingUrl,
      transcript: transcript,
      summary: summary,
      metadata: call,
      updated_at: new Date().toISOString()
    };

    // Add contact_id if found
    if (contact?.contact_id) {
      callData.contact_id = contact.contact_id;
    }

    // Add lead_id if found
    if (lead?.id) {
      callData.lead_id = lead.id;
    }

    // If the call exists, update it
    if (existingCall) {
      log(`Updating existing call ${callId}...`);
      
      const { error: updateError } = await supabase
        .from('calls')
        .update(callData)
        .eq('call_id', callId);

      if (updateError) {
        log(`Error updating call ${callId}: ${updateError.message}`);
        return false;
      }
    } else {
      // Otherwise, insert a new call
      log(`Inserting new call ${callId}...`);
      
      const { error: insertError } = await supabase
        .from('calls')
        .insert([callData]);

      if (insertError) {
        log(`Error inserting call ${callId}: ${insertError.message}`);
        return false;
      }
    }

    // Update contact profile if we have a contact
    if (contact?.contact_id) {
      await updateContactProfile(contact.contact_id);
    }

    // Update lead profile if we have a lead
    if (lead?.id) {
      await updateLeadProfile(lead.id, phoneNumber);
    }

    // Update enhanced lead if we have one
    if (enhancedLead?.lead_id) {
      await updateEnhancedLead(enhancedLead.lead_id, phoneNumber);
    }

    log(`Successfully processed call ${callId}`);
    return true;
  } catch (error) {
    log(`Error processing call ${call.id}: ${error.message}`);
    return false;
  }
}

/**
 * Update a contact profile with call data
 * @param {string} contactId - Contact ID
 * @returns {Promise<boolean>} - Success status
 */
async function updateContactProfile(contactId) {
  try {
    log(`Updating profile for contact ${contactId}...`);

    // Get all calls for the contact
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('contact_id', contactId)
      .order('start_time', { ascending: false });

    if (callsError) {
      throw callsError;
    }

    if (!calls || calls.length === 0) {
      log(`No calls found for contact ${contactId}`);
      return false;
    }

    log(`Found ${calls.length} calls for contact ${contactId}`);

    // Extract transcripts, summaries, and audio files from calls
    const transcripts = [];
    const summaries = [];
    const audioFiles = [];
    let totalCalls = 0;
    let answeredCalls = 0;
    let missedCalls = 0;
    let totalDuration = 0;

    // Process each call
    for (const call of calls) {
      totalCalls++;

      // Count answered and missed calls
      const status = String(call.call_status || '').toLowerCase();
      if (status === 'completed' || status === 'answered') {
        answeredCalls++;
        if (call.call_duration) {
          totalDuration += call.call_duration;
        }
      } else if (status === 'missed' || status === 'no-answer' || status === 'no answer') {
        missedCalls++;
      }

      // Add transcript if available
      if (call.transcript) {
        transcripts.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          text: call.transcript
        });
      }

      // Add summary if available
      if (call.summary) {
        summaries.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          text: call.summary
        });
      }

      // Add audio file if available
      if (call.recording_url) {
        audioFiles.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          url: call.recording_url
        });
      }
    }

    // Calculate average call duration
    const avgDuration = answeredCalls > 0 ? Math.round(totalDuration / answeredCalls) : 0;

    // Update contact profile
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        transcripts: transcripts,
        summaries: summaries,
        audio_files: audioFiles,
        call_stats: {
          total_calls: totalCalls,
          answered_calls: answeredCalls,
          missed_calls: missedCalls,
          avg_duration: avgDuration
        },
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', contactId);

    if (updateError) {
      throw updateError;
    }

    log(`Successfully updated profile for contact ${contactId}`);
    log(`Added ${transcripts.length} transcripts, ${summaries.length} summaries, ${audioFiles.length} audio files`);
    log(`Updated call stats: ${totalCalls} total, ${answeredCalls} answered, ${missedCalls} missed, ${avgDuration}s avg duration`);

    return true;
  } catch (error) {
    log(`Error updating profile for contact ${contactId}: ${error.message}`);
    return false;
  }
}

/**
 * Update a lead profile with call data
 * @param {string} leadId - Lead ID
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<boolean>} - Success status
 */
async function updateLeadProfile(leadId, phoneNumber) {
  try {
    log(`Updating profile for lead ${leadId}...`);

    // Get all calls for the lead
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('lead_id', leadId)
      .order('start_time', { ascending: false });

    if (callsError) {
      throw callsError;
    }

    if (!calls || calls.length === 0) {
      log(`No calls found for lead ${leadId}`);
      return false;
    }

    log(`Found ${calls.length} calls for lead ${leadId}`);

    // Calculate call statistics
    let totalCalls = 0;
    let answeredCalls = 0;
    let missedCalls = 0;
    let lastCallDate = null;
    let lastCallStatus = null;

    // Process each call
    for (const call of calls) {
      totalCalls++;

      // Count answered and missed calls
      const status = String(call.call_status || '').toLowerCase();
      if (status === 'completed' || status === 'answered') {
        answeredCalls++;
      } else if (status === 'missed' || status === 'no-answer' || status === 'no answer') {
        missedCalls++;
      }

      // Track last call date and status
      if (!lastCallDate || new Date(call.start_time) > new Date(lastCallDate)) {
        lastCallDate = call.start_time;
        lastCallStatus = call.call_status;
      }
    }

    // Check if lead profile exists
    const { data: leadProfile, error: leadProfileError } = await supabase
      .from('lead_profiles')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (leadProfileError && leadProfileError.code !== 'PGRST116') {
      throw leadProfileError;
    }

    if (leadProfile) {
      // Update existing lead profile
      const { error: updateError } = await supabase
        .from('lead_profiles')
        .update({
          total_calls: totalCalls,
          answered_calls: answeredCalls,
          missed_calls: missedCalls,
          last_call_date: lastCallDate,
          last_call_status: lastCallStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadProfile.id);

      if (updateError) {
        throw updateError;
      }

      log(`Successfully updated profile for lead ${leadId}`);
    } else {
      // Create new lead profile
      const { error: insertError } = await supabase
        .from('lead_profiles')
        .insert([{
          lead_id: leadId,
          phone: phoneNumber,
          first_contact_date: lastCallDate || new Date().toISOString(),
          total_calls: totalCalls,
          answered_calls: answeredCalls,
          missed_calls: missedCalls,
          last_call_date: lastCallDate,
          last_call_status: lastCallStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw insertError;
      }

      log(`Successfully created profile for lead ${leadId}`);
    }

    return true;
  } catch (error) {
    log(`Error updating profile for lead ${leadId}: ${error.message}`);
    return false;
  }
}

/**
 * Update an enhanced lead with call data
 * @param {string} leadId - Lead ID
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<boolean>} - Success status
 */
async function updateEnhancedLead(leadId, phoneNumber) {
  try {
    log(`Updating enhanced lead ${leadId}...`);

    // Get all calls for the phone number
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('start_time', { ascending: false });

    if (callsError) {
      throw callsError;
    }

    if (!calls || calls.length === 0) {
      log(`No calls found for phone ${phoneNumber}`);
      return false;
    }

    log(`Found ${calls.length} calls for phone ${phoneNumber}`);

    // Calculate call statistics
    let totalCalls = calls.length;
    let lastCallOutcome = null;

    // Get the most recent call
    const mostRecentCall = calls[0];
    if (mostRecentCall) {
      lastCallOutcome = mostRecentCall.call_outcome || mostRecentCall.call_status;
    }

    // Update the enhanced lead
    const { error: updateError } = await supabase
      .from('enhanced_leads')
      .update({
        total_calls: totalCalls,
        last_call_outcome: lastCallOutcome,
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId);

    if (updateError) {
      throw updateError;
    }

    log(`Successfully updated enhanced lead ${leadId}`);
    return true;
  } catch (error) {
    log(`Error updating enhanced lead ${leadId}: ${error.message}`);
    return false;
  }
}

/**
 * Process calls in batches
 * @param {Array} calls - Array of calls to process
 * @param {number} batchSize - Number of calls to process in each batch
 * @returns {Promise<void>}
 */
async function processBatchOfCalls(calls, batchSize = 5) {
  const totalCalls = calls.length;
  let processedCount = 0;
  let successCount = 0;

  // Process calls in batches to avoid rate limiting
  for (let i = 0; i < totalCalls; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalCalls / batchSize)} (${batch.length} calls)`);

    // Process each call in the batch
    for (const call of batch) {
      const success = await processCall(call);
      processedCount++;
      if (success) successCount++;

      // Log progress
      const progressPercent = Math.round((processedCount / totalCalls) * 100);
      log(`Progress: ${processedCount}/${totalCalls} (${progressPercent}%) - Success: ${successCount}`);

      // Add a small delay between calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Add a delay between batches to avoid rate limiting
    if (i + batchSize < totalCalls) {
      log("Waiting 5 seconds before processing next batch...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting Vapi call synchronization...');

    // Fetch all calls from Vapi
    const calls = await fetchAllCalls(100);
    log(`Retrieved ${calls.length} calls from Vapi`);

    if (calls.length === 0) {
      log('No calls to process');
      return;
    }

    // Process calls in batches
    await processBatchOfCalls(calls, 5);

    log('Vapi call synchronization completed successfully');
  } catch (error) {
    log(`Error synchronizing Vapi calls: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
