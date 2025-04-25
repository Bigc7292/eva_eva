const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const csv = require('csv-parser');
const { normalizePhoneNumber, formatPhoneNumberForDisplay } = require('./utils/phone-utils');
const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Vapi configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Replace with your actual API key

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Path to the CSV file
const CSV_FILE_PATH = 'c:\\Users\\Administrator\\Downloads\\calls_export_2025-04-24_1739.csv';

// Target phone number
const TARGET_PHONE_NUMBER = '+971565401583';

// Function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Function to get or create a contact
async function getOrCreateContact(phoneNumber, name = null) {
  try {
    // Normalize the phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone) {
      throw new Error(`Invalid phone number: ${phoneNumber}`);
    }

    log(`Normalized phone number: ${phoneNumber} -> ${normalizedPhone}`);

    // Check if contact exists with normalized phone number
    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone_number', normalizedPhone);

    if (fetchError) {
      throw fetchError;
    }

    if (existingContacts && existingContacts.length > 0) {
      log(`Found existing contact for ${normalizedPhone}: ${existingContacts[0].contact_id}`);
      return existingContacts[0];
    }

    // If not found with normalized number, try with original format
    if (normalizedPhone !== phoneNumber) {
      const { data: originalContacts, error: originalFetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone_number', phoneNumber);

      if (!originalFetchError && originalContacts && originalContacts.length > 0) {
        log(`Found existing contact with original format ${phoneNumber}: ${originalContacts[0].contact_id}`);

        // Update the contact with normalized phone number
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            phone_number: normalizedPhone,
            updated_at: new Date().toISOString()
          })
          .eq('contact_id', originalContacts[0].contact_id);

        if (updateError) {
          log(`Warning: Failed to update phone number format: ${updateError.message}`);
        } else {
          log(`Updated contact phone number format to ${normalizedPhone}`);
        }

        return originalContacts[0];
      }
    }

    // Create new contact with normalized phone number
    log(`Creating new contact for ${normalizedPhone}`);
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        phone_number: normalizedPhone,
        name: name || `Contact ${normalizedPhone}`,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        transcripts: [],
        summaries: [],
        audio_files: []
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    log(`Successfully created new contact: ${newContact.contact_id}`);
    return newContact;
  } catch (error) {
    log(`Error managing contact for ${phoneNumber}: ${error.message}`);
    throw error;
  }
}

// Function to parse date string
function parseDate(dateString) {
  if (!dateString || dateString === 'N/A') {
    return null;
  }

  try {
    // Example: "2025-04-23 15:00:45 GMT+4"
    const parts = dateString.split(' ');
    const datePart = parts[0]; // "2025-04-23"
    const timePart = parts[1]; // "15:00:45"

    // Combine date and time
    const dateTimeString = `${datePart}T${timePart}Z`;
    return new Date(dateTimeString).toISOString();
  } catch (error) {
    log(`Error parsing date ${dateString}: ${error.message}`);
    return null;
  }
}

// Function to parse duration string
function parseDuration(durationString) {
  if (!durationString || durationString === 'N/A') {
    return 0;
  }

  try {
    // Examples: "56s", "2m 32s"
    let totalSeconds = 0;

    // Check for minutes
    if (durationString.includes('m')) {
      const minutesPart = durationString.split('m')[0].trim();
      totalSeconds += parseInt(minutesPart) * 60;
    }

    // Check for seconds
    if (durationString.includes('s')) {
      const secondsPart = durationString.includes('m')
        ? durationString.split('m')[1].split('s')[0].trim()
        : durationString.split('s')[0].trim();
      totalSeconds += parseInt(secondsPart);
    }

    return totalSeconds;
  } catch (error) {
    log(`Error parsing duration ${durationString}: ${error.message}`);
    return 0;
  }
}

// Function to extract summary from evaluation
function extractSummary(evaluation) {
  if (!evaluation || evaluation === 'N/A') {
    return null;
  }

  // Try to extract a summary from the evaluation text
  // This is a simple approach - we're just taking the first few sentences
  const sentences = evaluation.split('.');
  if (sentences.length > 2) {
    return sentences.slice(0, 2).join('.') + '.';
  }

  return evaluation.substring(0, 200); // Limit to 200 characters
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

    // Fetch transcript
    let transcript = null;
    if (callDetails.status === 'completed' || callDetails.status === 'ended') {
      transcript = await fetchCallTranscript(callId);
    }

    // Fetch recording URL
    let recordingUrl = null;
    if (callDetails.status === 'completed' || callDetails.status === 'ended') {
      recordingUrl = await fetchCallRecording(callId);
    }

    // Extract summary from analysis if available
    let summary = null;
    if (callDetails.analysis && callDetails.analysis.summary) {
      summary = callDetails.analysis.summary;
    }

    // Extract AI analysis rating if available
    let aiRating = null;
    if (callDetails.analysis && callDetails.analysis.sentiment) {
      aiRating = callDetails.analysis.sentiment;
    }

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

// Function to process a CSV row
async function processRow(row) {
  try {
    // Skip if not for target phone number
    if (row['Customer Number'] !== TARGET_PHONE_NUMBER) {
      return { success: false, reason: 'Not for target phone number' };
    }

    log(`Processing call ${row['Call ID']} for ${TARGET_PHONE_NUMBER}...`);

    // Get or create contact
    const contact = await getOrCreateContact(TARGET_PHONE_NUMBER, 'Colin Loader');

    // Parse date and duration
    const startTime = parseDate(row['Date']);
    const duration = parseDuration(row['Duration']);

    // Calculate end time if start time is available
    let endTime = null;
    if (startTime && duration) {
      const endDate = new Date(startTime);
      endDate.setSeconds(endDate.getSeconds() + duration);
      endTime = endDate.toISOString();
    }

    // Extract summary from evaluation
    let summary = extractSummary(row['Success Evaluation']);

    // Fetch additional data from Vapi API
    const additionalData = await fetchAdditionalCallData(row['Call ID']);

    // Use data from Vapi API if available
    let transcript = null;
    let recordingUrl = null;
    let aiRating = null;
    let additionalMetadata = {};

    if (additionalData) {
      transcript = additionalData.transcript || null;
      recordingUrl = additionalData.recordingUrl || null;
      summary = additionalData.summary || summary; // Prefer Vapi summary if available
      aiRating = additionalData.aiRating || null;
      additionalMetadata = additionalData.callDetails || {};
    }

    // Create call record
    const callRecord = {
      call_id: row['Call ID'],
      contact_id: contact.contact_id,
      call_status: row['Ended Reason'] || 'unknown',
      call_type: row['Type'] || 'Outbound',
      start_time: startTime || new Date().toISOString(),
      end_time: endTime,
      duration: duration,
      recording_url: recordingUrl,
      audio_url: recordingUrl,
      transcript: transcript,
      summary: summary,
      ai_rating: aiRating,
      metadata: { ...row, ...additionalMetadata },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if call exists
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', row['Call ID']);

    if (fetchError) {
      throw fetchError;
    }

    if (existingCall && existingCall.length > 0) {
      // Update existing call
      log(`Updating existing call ${row['Call ID']}`);
      const { error: updateError } = await supabase
        .from('calls')
        .update(callRecord)
        .eq('call_id', row['Call ID']);

      if (updateError) {
        throw updateError;
      }

      log(`Successfully updated call ${row['Call ID']}`);
    } else {
      // Insert new call
      log(`Inserting new call ${row['Call ID']}`);
      const { error: insertError } = await supabase
        .from('calls')
        .insert(callRecord);

      if (insertError) {
        throw insertError;
      }

      log(`Successfully inserted call ${row['Call ID']}`);
    }

    return {
      success: true,
      call_id: row['Call ID'],
      contact_id: contact.contact_id
    };
  } catch (error) {
    log(`Error processing row for call ${row['Call ID']}: ${error.message}`);
    return {
      success: false,
      call_id: row['Call ID'],
      error: error.message
    };
  }
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

    // First, let's try to fetch additional data for all calls
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
    }

    // Now collect all the data for the contact profile
    for (const call of calls) {
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
    log('Starting to import Vapi calls from CSV file...');

    // Check if the file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`File not found: ${CSV_FILE_PATH}`);
    }

    // Read the CSV file
    const rows = [];

    // Create a promise to read the CSV file
    const readCsvPromise = new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => {
          log(`Read ${rows.length} rows from CSV file`);
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    // Wait for the CSV file to be read
    await readCsvPromise;

    log(`Found ${rows.length} calls in the CSV file`);

    // Process each row
    let successCount = 0;
    let errorCount = 0;
    let contactId = null;

    for (const row of rows) {
      try {
        const result = await processRow(row);

        if (result.success) {
          successCount++;
          contactId = result.contact_id;
        } else {
          errorCount++;
        }
      } catch (error) {
        log(`Error processing row: ${error.message}`);
        errorCount++;
      }
    }

    // Update contact profile
    if (contactId) {
      await updateContactProfile(contactId);
    }

    log(`Import completed. Successfully processed ${successCount} calls. Errors: ${errorCount}`);
  } catch (error) {
    log(`Error importing calls: ${error.message}`);
  }
}

// Run the main function
main();
