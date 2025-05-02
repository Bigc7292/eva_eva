/**
 * Script to synchronize Vapi call data with the database
 * This script will:
 * 1. Fetch all calls from Vapi
 * 2. Store them in the calls table
 * 3. Update contact profiles with call data
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
 * Create or update a contact
 * @param {string} phoneNumber - Phone number
 * @param {string} name - Contact name
 * @returns {Promise<string|null>} - Contact ID or null if error
 */
async function createOrUpdateContact(phoneNumber, name) {
  try {
    if (!phoneNumber || phoneNumber === 'Unknown') {
      return null;
    }
    
    // Check if contact exists
    const { data: existingContact, error: findError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();
    
    if (findError) {
      log(`Error finding contact for ${phoneNumber}: ${findError.message}`);
      return null;
    }
    
    if (existingContact) {
      log(`Found existing contact for ${phoneNumber}: ${existingContact.name}`);
      return existingContact.id;
    }
    
    // Create new contact
    const contactName = name || `Contact ${phoneNumber}`;
    
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert([{
        name: contactName,
        phone_number: phoneNumber,
        profile_created_at: new Date().toISOString(),
        transcripts: [],
        summaries: [],
        audio_files: []
      }])
      .select()
      .single();
    
    if (createError) {
      log(`Error creating contact for ${phoneNumber}: ${createError.message}`);
      return null;
    }
    
    log(`Created new contact for ${phoneNumber}: ${contactName}`);
    return newContact.id;
  } catch (error) {
    log(`Error in createOrUpdateContact for ${phoneNumber}: ${error.message}`);
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
    const phoneNumber = call.customer?.number || 'Unknown';
    const callType = call.type === 'outboundPhoneCall' ? 'Outbound' : 'Inbound';
    const callStatus = call.status || 'Unknown';
    const startTime = call.startedAt || call.createdAt || new Date().toISOString();
    const endTime = call.endedAt || null;
    const duration = call.duration || 0;
    const recordingUrl = call.recordingUrl || call.artifact?.recording || call.artifact?.recordingUrl || null;
    const transcript = call.transcript || call.artifact?.transcript || null;
    const summary = call.summary || call.analysis?.summary || null;

    // Create or update contact
    const contactId = await createOrUpdateContact(phoneNumber, null);

    // Store call data
    const callData = {
      call_id: callId,
      phone_number: phoneNumber,
      call_type: callType,
      call_status: callStatus,
      start_time: startTime,
      end_time: endTime,
      duration: duration,
      recording_url: recordingUrl,
      transcript: transcript,
      summary: summary,
      metadata: call
    };

    if (contactId) {
      callData.contact_id = contactId;
    }

    // Check if call exists
    const { data: existingCall, error: findError } = await supabase
      .from('calls')
      .select('id')
      .eq('call_id', callId)
      .maybeSingle();

    if (findError) {
      log(`Error checking if call ${callId} exists: ${findError.message}`);
    }

    if (existingCall) {
      // Update existing call
      const { error: updateError } = await supabase
        .from('calls')
        .update(callData)
        .eq('id', existingCall.id);

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
    if (contactId) {
      await updateContactProfile(contactId, callId, transcript, summary, recordingUrl);
    }

    return true;
  } catch (error) {
    log(`Error processing call ${call.id}: ${error.message}`);
    return false;
  }
}

/**
 * Update a contact profile with call data
 * @param {string} contactId - Contact ID
 * @param {string} callId - Call ID
 * @param {string} transcript - Call transcript
 * @param {string} summary - Call summary
 * @param {string} recordingUrl - Recording URL
 * @returns {Promise<boolean>} - Success status
 */
async function updateContactProfile(contactId, callId, transcript, summary, recordingUrl) {
  try {
    log(`Updating profile for contact ${contactId} with call ${callId}...`);

    // Get current contact data
    const { data: contact, error: getError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (getError) {
      log(`Error getting contact ${contactId}: ${getError.message}`);
      return false;
    }

    // Update arrays
    const transcripts = Array.isArray(contact.transcripts) ? contact.transcripts : [];
    const summaries = Array.isArray(contact.summaries) ? contact.summaries : [];
    const audioFiles = Array.isArray(contact.audio_files) ? contact.audio_files : [];

    // Add new data
    if (transcript) {
      transcripts.push({
        call_id: callId,
        timestamp: new Date().toISOString(),
        text: transcript
      });
    }

    if (summary) {
      summaries.push({
        call_id: callId,
        timestamp: new Date().toISOString(),
        text: summary
      });
    }

    if (recordingUrl) {
      audioFiles.push({
        call_id: callId,
        timestamp: new Date().toISOString(),
        url: recordingUrl
      });
    }

    // Update contact
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        transcripts: transcripts,
        summaries: summaries,
        audio_files: audioFiles,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (updateError) {
      log(`Error updating contact ${contactId}: ${updateError.message}`);
      return false;
    }

    log(`Updated profile for contact ${contactId}`);
    return true;
  } catch (error) {
    log(`Error updating profile for contact ${contactId}: ${error.message}`);
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
