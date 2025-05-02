/**
 * Script to add Vapi call data to existing database tables
 * This script will:
 * 1. Fetch all calls from Vapi
 * 2. Add them to the existing calls table
 * 3. Update profiles with call data
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
 * Fetch all calls from Vapi
 * @param {number} limit - Number of calls to fetch per page
 * @returns {Promise<Array>} - Array of calls
 */
async function fetchAllCalls(limit = 100) {
  try {
    const url = `${VAPI_API_URL}/call?limit=${limit}`;
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
    
    // Return the calls array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log(`Error fetching calls: ${error.message}`);
    return [];
  }
}

/**
 * Get table columns
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} - Array of column names
 */
async function getTableColumns(tableName) {
  try {
    // Get table columns
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    // Return column names
    return data && data.length > 0 ? Object.keys(data[0]) : [];
  } catch (error) {
    log(`Error getting columns for table ${tableName}: ${error.message}`);
    return [];
  }
}

/**
 * Find contact by phone number
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<Object|null>} - Contact or null if not found
 */
async function findContactByPhone(phoneNumber) {
  try {
    if (!phoneNumber || phoneNumber === 'Unknown') {
      return null;
    }
    
    // Find contact by phone number
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', phoneNumber)
      .maybeSingle();
    
    if (error) {
      // Try alternative column name
      const { data: altData, error: altError } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle();
      
      if (altError) {
        log(`Error finding contact for ${phoneNumber}: ${altError.message}`);
        return null;
      }
      
      return altData;
    }
    
    return data;
  } catch (error) {
    log(`Error finding contact for ${phoneNumber}: ${error.message}`);
    return null;
  }
}

/**
 * Process a call and add it to the database
 * @param {Object} call - Call data from Vapi
 * @param {Array} callsColumns - Columns in the calls table
 * @returns {Promise<boolean>} - Success status
 */
async function processCall(call, callsColumns) {
  try {
    log(`Processing call ${call.id}...`);

    // Extract relevant data
    const callId = call.id;
    const phoneNumber = call.customer?.number || 'Unknown';
    const callType = call.type === 'outboundPhoneCall' ? 'Outbound' : 'Inbound';
    const callStatus = call.status || 'Unknown';
    const startTime = call.startedAt || call.createdAt || new Date().toISOString();
    const endTime = call.endedAt || null;
    const duration = call.duration || 0;
    const recordingUrl = call.recordingUrl || call.artifact?.recording || call.artifact?.recordingUrl || null;
    const transcript = call.transcript || call.artifact?.transcript || null;
    const summary = call.summary || call.analysis?.summary || null;

    // Find contact by phone number
    const contact = await findContactByPhone(phoneNumber);
    
    // Prepare call data based on available columns
    const callData = {};
    
    // Map data to columns
    if (callsColumns.includes('vapi_id')) callData.vapi_id = callId;
    if (callsColumns.includes('call_id')) callData.call_id = callId;
    if (callsColumns.includes('phone') || callsColumns.includes('phone_number')) {
      if (callsColumns.includes('phone')) callData.phone = phoneNumber;
      if (callsColumns.includes('phone_number')) callData.phone_number = phoneNumber;
    }
    if (callsColumns.includes('type') || callsColumns.includes('call_type')) {
      if (callsColumns.includes('type')) callData.type = callType;
      if (callsColumns.includes('call_type')) callData.call_type = callType;
    }
    if (callsColumns.includes('status') || callsColumns.includes('call_status')) {
      if (callsColumns.includes('status')) callData.status = callStatus;
      if (callsColumns.includes('call_status')) callData.call_status = callStatus;
    }
    if (callsColumns.includes('start_time')) callData.start_time = startTime;
    if (callsColumns.includes('end_time')) callData.end_time = endTime;
    if (callsColumns.includes('duration')) callData.duration = duration;
    if (callsColumns.includes('recording_url')) callData.recording_url = recordingUrl;
    if (callsColumns.includes('transcript')) callData.transcript = transcript;
    if (callsColumns.includes('summary')) callData.summary = summary;
    if (callsColumns.includes('metadata')) callData.metadata = call;
    
    // Add contact_id if found and column exists
    if (contact && (callsColumns.includes('contact_id') || callsColumns.includes('lead_id'))) {
      if (callsColumns.includes('contact_id')) callData.contact_id = contact.id;
      if (callsColumns.includes('lead_id')) callData.lead_id = contact.id;
    }
    
    // Check if call exists
    const { data: existingCall, error: findError } = await supabase
      .from('calls')
      .select('*')
      .eq(callsColumns.includes('call_id') ? 'call_id' : 'vapi_id', callId)
      .maybeSingle();
    
    if (findError) {
      log(`Error checking if call ${callId} exists: ${findError.message}`);
    }
    
    if (existingCall) {
      // Update existing call
      const { error: updateError } = await supabase
        .from('calls')
        .update(callData)
        .eq(callsColumns.includes('call_id') ? 'call_id' : 'vapi_id', callId);
      
      if (updateError) {
        log(`Error updating call ${callId}: ${updateError.message}`);
        return false;
      }
      
      log(`Updated existing call ${callId}`);
    } else {
      // Insert new call
      const { error: insertError } = await supabase
        .from('calls')
        .insert([callData]);
      
      if (insertError) {
        log(`Error inserting call ${callId}: ${insertError.message}`);
        return false;
      }
      
      log(`Inserted new call ${callId}`);
    }
    
    // Update contact profile with call data
    if (contact) {
      await updateContactProfile(contact, callId, transcript, summary, recordingUrl);
    }
    
    return true;
  } catch (error) {
    log(`Error processing call ${call.id}: ${error.message}`);
    return false;
  }
}

/**
 * Update a contact profile with call data
 * @param {Object} contact - Contact object
 * @param {string} callId - Call ID
 * @param {string} transcript - Call transcript
 * @param {string} summary - Call summary
 * @param {string} recordingUrl - Recording URL
 * @returns {Promise<boolean>} - Success status
 */
async function updateContactProfile(contact, callId, transcript, summary, recordingUrl) {
  try {
    log(`Updating profile for contact ${contact.id} with call ${callId}...`);
    
    // Get contact columns
    const contactsColumns = Object.keys(contact);
    
    // Prepare update data
    const updateData = {};
    
    // Add transcripts if column exists
    if (contactsColumns.includes('transcripts') && transcript) {
      const transcripts = Array.isArray(contact.transcripts) ? contact.transcripts : [];
      transcripts.push({
        call_id: callId,
        timestamp: new Date().toISOString(),
        text: transcript
      });
      updateData.transcripts = transcripts;
    }
    
    // Add summaries if column exists
    if (contactsColumns.includes('summaries') && summary) {
      const summaries = Array.isArray(contact.summaries) ? contact.summaries : [];
      summaries.push({
        call_id: callId,
        timestamp: new Date().toISOString(),
        text: summary
      });
      updateData.summaries = summaries;
    }
    
    // Add audio files if column exists
    if (contactsColumns.includes('audio_files') && recordingUrl) {
      const audioFiles = Array.isArray(contact.audio_files) ? contact.audio_files : [];
      audioFiles.push({
        call_id: callId,
        timestamp: new Date().toISOString(),
        url: recordingUrl
      });
      updateData.audio_files = audioFiles;
    }
    
    // Update contact if we have data to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id);
      
      if (updateError) {
        log(`Error updating contact ${contact.id}: ${updateError.message}`);
        return false;
      }
      
      log(`Updated profile for contact ${contact.id}`);
      return true;
    }
    
    log(`No profile updates needed for contact ${contact.id}`);
    return true;
  } catch (error) {
    log(`Error updating profile for contact ${contact.id}: ${error.message}`);
    return false;
  }
}

/**
 * Process calls in batches
 * @param {Array} calls - Array of calls to process
 * @param {Array} callsColumns - Columns in the calls table
 * @param {number} batchSize - Number of calls to process in each batch
 * @returns {Promise<void>}
 */
async function processBatchOfCalls(calls, callsColumns, batchSize = 5) {
  const totalCalls = calls.length;
  let processedCount = 0;
  let successCount = 0;

  // Process calls in batches to avoid rate limiting
  for (let i = 0; i < totalCalls; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalCalls / batchSize)} (${batch.length} calls)`);

    // Process each call in the batch
    for (const call of batch) {
      const success = await processCall(call, callsColumns);
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

    // Get calls table columns
    log('Getting calls table columns...');
    const callsColumns = await getTableColumns('calls');
    log(`Found columns in calls table: ${callsColumns.join(', ')}`);

    // Fetch all calls from Vapi
    const calls = await fetchAllCalls(100);
    log(`Retrieved ${calls.length} calls from Vapi`);

    if (calls.length === 0) {
      log('No calls to process');
      return;
    }

    // Process calls in batches
    await processBatchOfCalls(calls, callsColumns, 5);

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
