/**
 * Script to fix audio recordings display on profile pages
 * This script will:
 * 1. Find calls with missing audio recordings
 * 2. Fetch audio recordings from Vapi
 * 3. Update calls and contacts with the audio recordings
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
 * Find calls with missing audio recordings
 * @returns {Promise<Array>} - Array of calls with missing audio recordings
 */
async function findCallsWithMissingAudio() {
  try {
    log('Finding calls with missing audio recordings...');
    
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .is('recording_url', null)
      .is('audio_url', null)
      .not('call_id', 'is', null);
    
    if (error) {
      throw error;
    }
    
    log(`Found ${data.length} calls with missing audio recordings`);
    return data;
  } catch (error) {
    log(`Error finding calls with missing audio recordings: ${error.message}`);
    return [];
  }
}

/**
 * Fetch audio recording from Vapi
 * @param {string} callId - Call ID
 * @returns {Promise<string|null>} - Audio recording URL or null if not found
 */
async function fetchAudioRecording(callId) {
  try {
    log(`Fetching audio recording for call ${callId}...`);
    
    const response = await fetch(`${VAPI_API_URL}/call/${callId}/recording`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`Error fetching audio recording for call ${callId}: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.url) {
      log(`No audio recording URL found for call ${callId}`);
      return null;
    }
    
    log(`Found audio recording URL for call ${callId}: ${data.url}`);
    return data.url;
  } catch (error) {
    log(`Error fetching audio recording for call ${callId}: ${error.message}`);
    return null;
  }
}

/**
 * Update call with audio recording URL
 * @param {string} callId - Call ID
 * @param {string} audioUrl - Audio recording URL
 * @returns {Promise<boolean>} - Success status
 */
async function updateCallWithAudio(callId, audioUrl) {
  try {
    log(`Updating call ${callId} with audio recording URL: ${audioUrl}`);
    
    const { error } = await supabase
      .from('calls')
      .update({ recording_url: audioUrl })
      .eq('call_id', callId);
    
    if (error) {
      throw error;
    }
    
    log(`Successfully updated call ${callId} with audio recording URL`);
    return true;
  } catch (error) {
    log(`Error updating call ${callId} with audio recording URL: ${error.message}`);
    return false;
  }
}

/**
 * Update contact with audio recording
 * @param {string} contactId - Contact ID
 * @param {string} callId - Call ID
 * @param {string} audioUrl - Audio recording URL
 * @returns {Promise<boolean>} - Success status
 */
async function updateContactWithAudio(contactId, callId, audioUrl) {
  try {
    log(`Updating contact ${contactId} with audio recording for call ${callId}...`);
    
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
      audioFiles[existingIndex].url = audioUrl;
    } else {
      // Add new audio file
      audioFiles.push({
        call_id: callId,
        timestamp: new Date().toISOString(),
        url: audioUrl
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
    
    log(`Successfully updated contact ${contactId} with audio recording for call ${callId}`);
    return true;
  } catch (error) {
    log(`Error updating contact ${contactId} with audio recording: ${error.message}`);
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
        // Fetch audio recording
        const audioUrl = await fetchAudioRecording(call.call_id);
        
        if (!audioUrl) {
          log(`No audio recording found for call ${call.call_id}`);
          processedCount++;
          continue;
        }
        
        // Update call with audio recording URL
        const callUpdateSuccess = await updateCallWithAudio(call.call_id, audioUrl);
        
        // Update contact with audio recording
        if (callUpdateSuccess && call.contact_id) {
          await updateContactWithAudio(call.contact_id, call.call_id, audioUrl);
          successCount++;
        }
        
        processedCount++;
        
        // Log progress
        const progressPercent = Math.round((processedCount / totalCalls) * 100);
        log(`Progress: ${processedCount}/${totalCalls} (${progressPercent}%) - Success: ${successCount}`);
      } catch (error) {
        log(`Error processing call ${call.call_id}: ${error.message}`);
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
    log('Starting audio recordings fix...');
    
    // Find calls with missing audio recordings
    const calls = await findCallsWithMissingAudio();
    
    if (calls.length === 0) {
      log('No calls with missing audio recordings found. Nothing to fix.');
      return;
    }
    
    // Process calls in batches
    await processBatchOfCalls(calls);
    
    log('Audio recordings fix completed successfully');
  } catch (error) {
    log(`Error fixing audio recordings: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
