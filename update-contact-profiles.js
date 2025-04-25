/**
 * Script to update all contact profiles with the latest call data
 */

const { createClient } = require('@supabase/supabase-js');
const { normalizePhoneNumber } = require('./utils/phone-utils');
const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Vapi configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Replace with your actual API key

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
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
 * Fetch call transcript from Vapi
 * @param {string} callId - The ID of the call
 * @returns {Promise<string|null>} - Transcript text or null if error
 */
async function fetchCallTranscript(callId) {
  try {
    log(`Fetching transcript for call ${callId}...`);

    const response = await fetch(`${VAPI_API_URL}/call/${callId}/transcript`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`No transcript available for call ${callId}: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    log(`Successfully retrieved transcript for call ${callId}`);
    return data.transcript;
  } catch (error) {
    log(`Error fetching transcript for ${callId}: ${error.message}`);
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
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch additional call data from Vapi
async function fetchAdditionalCallData(callId) {
  try {
    log(`Fetching additional data for call ${callId}...`);

    // Fetch call details
    const callDetails = await fetchCallDetails(callId);
    if (!callDetails) {
      log(`No call details found for ${callId}`);
      return null;
    }

    // Add a delay to avoid rate limiting
    await sleep(1000);

    // Fetch transcript
    let transcript = null;
    if (callDetails.status === 'completed' || callDetails.status === 'ended') {
      transcript = await fetchCallTranscript(callId);
      // Add a delay to avoid rate limiting
      await sleep(1000);
    }

    // Fetch recording URL
    let recordingUrl = null;
    if (callDetails.status === 'completed' || callDetails.status === 'ended') {
      recordingUrl = await fetchCallRecording(callId);
      // Add a delay to avoid rate limiting
      await sleep(1000);
    }

    // Extract summary from analysis if available
    const summary = callDetails.analysis?.summary || null;

    // Extract AI analysis rating if available
    const aiRating = callDetails.analysis?.sentiment || null;

    return {
      transcript,
      recordingUrl,
      summary,
      aiRating,
      callDetails
    };
  } catch (error) {
    log(`Error fetching additional data for call ${callId}: ${error.message}`);
    return null;
  }
}

/**
 * Process a batch of calls to fetch additional data
 * @param {Array} calls - Array of calls to process
 * @param {number} batchSize - Number of calls to process in each batch
 * @returns {Promise<Array>} - Processed calls
 */
async function processBatchOfCalls(calls, batchSize = 5) {
  const processedCalls = [...calls];
  const totalCalls = calls.length;

  // Process calls in batches to avoid rate limiting
  for (let i = 0; i < totalCalls; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalCalls / batchSize)} (${batch.length} calls)`);

    // Process each call in the batch
    const promises = batch.map(async (call) => {
      // For each call, try to fetch additional data if missing
      if (!call.transcript || !call.recording_url || !call.summary || !call.ai_rating) {
        try {
          log(`Fetching additional data for call ${call.call_id}...`);
          const additionalData = await fetchAdditionalCallData(call.call_id);

          if (additionalData) {
            // Update the call record with the additional data
            const updateData = {};

            if (additionalData.transcript && !call.transcript) {
              updateData.transcript = additionalData.transcript;
              call.transcript = additionalData.transcript;
              log(`Added transcript for call ${call.call_id}`);
            }

            if (additionalData.recordingUrl && !call.recording_url) {
              updateData.recording_url = additionalData.recordingUrl;
              updateData.audio_url = additionalData.recordingUrl;
              call.recording_url = additionalData.recordingUrl;
              call.audio_url = additionalData.recordingUrl;
              log(`Added recording URL for call ${call.call_id}: ${additionalData.recordingUrl}`);
            }

            if (additionalData.summary && !call.summary) {
              updateData.summary = additionalData.summary;
              call.summary = additionalData.summary;
              log(`Added summary for call ${call.call_id}`);
            }

            if (additionalData.aiRating && !call.ai_rating) {
              updateData.ai_rating = additionalData.aiRating;
              call.ai_rating = additionalData.aiRating;
              log(`Added AI rating for call ${call.call_id}: ${additionalData.aiRating}`);
            }

            if (Object.keys(updateData).length > 0) {
              updateData.updated_at = new Date().toISOString();

              // Update the call record in the database
              const { error: updateError } = await supabase
                .from('calls')
                .update(updateData)
                .eq('call_id', call.call_id);

              if (updateError) {
                log(`Warning: Failed to update call ${call.call_id} with additional data: ${updateError.message}`);
              } else {
                log(`Updated call ${call.call_id} with additional data`);
              }
            }
          } else {
            log(`No additional data found for call ${call.call_id}`);
          }
        } catch (error) {
          log(`Error fetching additional data for call ${call.call_id}: ${error.message}`);
        }
      }

      return call;
    });

    // Wait for all calls in the batch to be processed
    await Promise.all(promises);

    // Add a delay between batches to avoid rate limiting
    if (i + batchSize < totalCalls) {
      log("Waiting 5 seconds before processing next batch...");
      await sleep(5000);
    }
  }

  return processedCalls;
}

// Function to update contact profile
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
    const aiRatings = [];
    let totalCalls = 0;
    let answeredCalls = 0;
    let missedCalls = 0;
    let totalDuration = 0;

    // First, calculate call statistics
    for (const call of calls) {
      totalCalls++;

      // Count answered and missed calls
      const status = String(call.call_status || '').toLowerCase();
      if (status === 'completed' || status === 'answered') {
        answeredCalls++;
        if (call.duration) {
          totalDuration += call.duration;
        }
      } else if (status === 'missed' || status === 'no-answer' || status === 'no answer') {
        missedCalls++;
      }
    }

    // Process calls in batches to avoid rate limiting
    const processedCalls = await processBatchOfCalls(calls, 5);

    // Now collect all the data for the contact profile
    for (const call of processedCalls) {
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
      const audioUrl = call.audio_url || call.recording_url;
      if (audioUrl) {
        audioFiles.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          url: audioUrl
        });
      }

      // Add AI rating if available
      if (call.ai_rating) {
        aiRatings.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          rating: call.ai_rating
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
        ai_ratings: aiRatings,
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
    log(`Added ${transcripts.length} transcripts, ${summaries.length} summaries, ${audioFiles.length} audio files, and ${aiRatings.length} AI ratings`);
    log(`Updated call stats: ${totalCalls} total, ${answeredCalls} answered, ${missedCalls} missed, ${avgDuration}s avg duration`);

    return true;
  } catch (error) {
    log(`Error updating profile for contact ${contactId}: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    log('Starting contact profile update...');

    // Get specific contact for Colin Loader
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('contact_id, phone_number, name')
      .eq('phone_number', '+971565401583');

    if (contactsError) {
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      log('No contacts found');
      return;
    }

    log(`Found ${contacts.length} contacts`);

    // Update each contact profile
    for (const contact of contacts) {
      log(`Processing contact ${contact.name} (${contact.phone_number})...`);
      await updateContactProfile(contact.contact_id);
    }

    log('Contact profile update completed successfully');
  } catch (error) {
    log(`Error updating contact profiles: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
