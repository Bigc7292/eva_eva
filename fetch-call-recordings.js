/**
 * Script to fetch call recordings from Vapi
 * This script will:
 * 1. Fetch all calls from Vapi
 * 2. Extract recording URLs from the call data
 * 3. Update calls and contacts with the recording URLs
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
 * Fetch call details from Vapi
 * @param {string} callId - Call ID
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
      log(`Error fetching call details for ${callId}: ${response.status} - ${errorText}`);
      return null;
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
 * Update call with recording URL
 * @param {string} callId - Call ID
 * @param {string} recordingUrl - Recording URL
 * @returns {Promise<boolean>} - Success status
 */
async function updateCallWithRecording(callId, recordingUrl) {
  try {
    log(`Updating call ${callId} with recording URL: ${recordingUrl}`);
    
    const { error } = await supabase
      .from('calls')
      .update({ recording_url: recordingUrl })
      .eq('call_id', callId);
    
    if (error) {
      throw error;
    }
    
    log(`Successfully updated call ${callId} with recording URL`);
    return true;
  } catch (error) {
    log(`Error updating call ${callId} with recording URL: ${error.message}`);
    return false;
  }
}

/**
 * Update contact with recording
 * @param {string} contactId - Contact ID
 * @param {string} callId - Call ID
 * @param {string} recordingUrl - Recording URL
 * @returns {Promise<boolean>} - Success status
 */
async function updateContactWithRecording(contactId, callId, recordingUrl) {
  try {
    log(`Updating contact ${contactId} with recording for call ${callId}...`);
    
    // Get current contact data
    const { data: contact, error: getError } = await supabase
      .from('contacts')
      .select('*')
      .eq('contact_id', contactId)
      .single();
    
    if (getError) {
      throw getError;
    }
    
    // Update audio_files array
    const audioFiles = Array.isArray(contact.audio_files) ? contact.audio_files : [];
    
    // Check if this call already has an audio file
    const existingIndex = audioFiles.findIndex(audio => audio.call_id === callId);
    
    if (existingIndex >= 0) {
      // Update existing audio file
      audioFiles[existingIndex].url = recordingUrl;
    } else {
      // Add new audio file
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
        audio_files: audioFiles,
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', contactId);
    
    if (updateError) {
      throw updateError;
    }
    
    log(`Successfully updated contact ${contactId} with recording for call ${callId}`);
    return true;
  } catch (error) {
    log(`Error updating contact ${contactId} with recording: ${error.message}`);
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
      try {
        // Extract recording URL from call data
        let recordingUrl = call.recordingUrl || 
                          (call.artifact && call.artifact.recording) || 
                          (call.artifact && call.artifact.recordingUrl);
        
        if (!recordingUrl) {
          // Fetch call details to get recording URL
          const callDetails = await fetchCallDetails(call.id);
          
          if (callDetails) {
            recordingUrl = callDetails.recordingUrl || 
                          (callDetails.artifact && callDetails.artifact.recording) || 
                          (callDetails.artifact && callDetails.artifact.recordingUrl);
          }
        }
        
        if (!recordingUrl) {
          log(`No recording URL found for call ${call.id}`);
          processedCount++;
          continue;
        }
        
        log(`Found recording URL for call ${call.id}: ${recordingUrl}`);
        
        // Find call in database
        const { data: dbCall, error: dbCallError } = await supabase
          .from('calls')
          .select('*')
          .eq('call_id', call.id)
          .maybeSingle();
        
        if (dbCallError) {
          log(`Error finding call ${call.id} in database: ${dbCallError.message}`);
          processedCount++;
          continue;
        }
        
        if (!dbCall) {
          log(`Call ${call.id} not found in database`);
          processedCount++;
          continue;
        }
        
        // Update call with recording URL
        const callUpdateSuccess = await updateCallWithRecording(call.id, recordingUrl);
        
        // Update contact with recording
        if (callUpdateSuccess && dbCall.contact_id) {
          await updateContactWithRecording(dbCall.contact_id, call.id, recordingUrl);
          successCount++;
        }
        
        processedCount++;
        
        // Log progress
        const progressPercent = Math.round((processedCount / totalCalls) * 100);
        log(`Progress: ${processedCount}/${totalCalls} (${progressPercent}%) - Success: ${successCount}`);
      } catch (error) {
        log(`Error processing call ${call.id}: ${error.message}`);
        processedCount++;
      }
      
      // Add a small delay between calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Add a delay between batches
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
    log('Starting call recordings fetch...');
    
    // Fetch all calls from Vapi
    const calls = await fetchAllCalls(100);
    
    if (calls.length === 0) {
      log('No calls found in Vapi. Nothing to process.');
      return;
    }
    
    log(`Found ${calls.length} calls in Vapi`);
    
    // Process calls in batches
    await processBatchOfCalls(calls);
    
    log('Call recordings fetch completed successfully');
  } catch (error) {
    log(`Error fetching call recordings: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
