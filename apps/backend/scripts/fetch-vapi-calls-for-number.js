const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../frontend/.env.local') });

// Configuration
const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const TARGET_PHONE_NUMBER = '+971565401583';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Log file path
const logFilePath = path.join(tempDir, 'vapi-fetch-specific-number.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

/**
 * Log message to console and file
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

/**
 * Fetch all calls from Vapi with pagination
 */
async function fetchAllCalls(cursor = null, allCalls = []) {
  try {
    const limit = 100;
    let url = `${VAPI_API_URL}/call?limit=${limit}`;

    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    log(`Fetching calls from Vapi (cursor: ${cursor || 'initial'})...`);

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
    const calls = data.calls || [];

    log(`Retrieved ${calls.length} calls from Vapi`);

    // Add calls to the result
    const updatedCalls = [...allCalls, ...calls];

    // Check if there are more calls to fetch
    if (data.next_cursor) {
      log(`More calls available, fetching next page with cursor: ${data.next_cursor}`);
      return fetchAllCalls(data.next_cursor, updatedCalls);
    }

    log(`Completed fetching all calls. Total calls: ${updatedCalls.length}`);
    return updatedCalls;
  } catch (error) {
    log(`Error fetching calls: ${error.message}`);
    throw error;
  }
}

/**
 * Filter calls for a specific phone number
 */
function filterCallsForPhoneNumber(calls, phoneNumber) {
  const filteredCalls = calls.filter(call => {
    // Check customer number
    if (call.customer && call.customer.number === phoneNumber) {
      return true;
    }

    // Check destination number
    if (call.destination && call.destination.number === phoneNumber) {
      return true;
    }

    // Check if the phone number is in the call metadata
    if (call.metadata && JSON.stringify(call.metadata).includes(phoneNumber)) {
      return true;
    }

    return false;
  });

  log(`Found ${filteredCalls.length} calls for phone number ${phoneNumber}`);
  return filteredCalls;
}

/**
 * Fetch call details from Vapi
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
 * Get or create a contact in the database
 */
async function getOrCreateContact(phoneNumber, name = null) {
  try {
    // Check if contact exists
    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone_number', phoneNumber);

    if (fetchError) {
      throw fetchError;
    }

    if (existingContacts && existingContacts.length > 0) {
      log(`Found existing contact for ${phoneNumber}: ${existingContacts[0].contact_id}`);
      return existingContacts[0];
    }

    // Create new contact
    log(`Creating new contact for ${phoneNumber}`);
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        phone_number: phoneNumber,
        name: name || `Contact ${phoneNumber}`,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

/**
 * Upsert call data to the database
 */
async function upsertCallData(callData, callDetails, recordingUrl) {
  try {
    const phoneNumber = callData.customer?.number || callDetails?.customer?.number || 'Unknown';

    // Get or create contact
    const contact = await getOrCreateContact(phoneNumber);

    // Extract call data
    const callRecord = {
      call_id: callData.id,
      contact_id: contact.contact_id,
      call_status: callData.status || 'unknown',
      call_type: callData.type === 'outboundPhoneCall' ? 'Outbound' : 'Inbound',
      start_time: callData.startedAt || new Date().toISOString(),
      end_time: callData.endedAt || null,
      duration: callData.durationSeconds ? Math.round(Number(callData.durationSeconds)) : 0,
      recording_url: recordingUrl || null,
      audio_url: recordingUrl || null, // For consistency
      transcript: callDetails?.artifact?.transcript || null,
      summary: callDetails?.analysis?.summary || null,
      metadata: callDetails || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if call exists
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', callData.id);

    if (fetchError) {
      throw fetchError;
    }

    if (existingCall && existingCall.length > 0) {
      // Update existing call
      log(`Updating existing call ${callData.id}`);
      const { error: updateError } = await supabase
        .from('calls')
        .update(callRecord)
        .eq('call_id', callData.id);

      if (updateError) {
        throw updateError;
      }

      log(`Successfully updated call ${callData.id}`);
    } else {
      // Insert new call
      log(`Inserting new call ${callData.id}`);
      const { error: insertError } = await supabase
        .from('calls')
        .insert(callRecord);

      if (insertError) {
        throw insertError;
      }

      log(`Successfully inserted call ${callData.id}`);
    }

    return true;
  } catch (error) {
    log(`Error upserting call data for ${callData.id}: ${error.message}`);
    return false;
  }
}

/**
 * Update contact profile with call data
 */
async function updateContactProfile(contactId, calls) {
  try {
    log(`Updating profile for contact ${contactId}...`);

    // Extract transcripts, summaries, and audio files from calls
    const transcripts = [];
    const summaries = [];
    const audioFiles = [];

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
    }

    // Update contact profile
    const { error } = await supabase
      .from('contacts')
      .update({
        transcripts: transcripts,
        summaries: summaries,
        audio_files: audioFiles,
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', contactId);

    if (error) {
      throw error;
    }

    log(`Successfully updated profile for contact ${contactId}`);
    log(`Added ${transcripts.length} transcripts, ${summaries.length} summaries, and ${audioFiles.length} audio files`);

    return true;
  } catch (error) {
    log(`Error updating profile for contact ${contactId}: ${error.message}`);
    return false;
  }
}

/**
 * Get all calls for a contact from the database
 */
async function getCallsForContact(contactId) {
  try {
    log(`Fetching calls for contact ${contactId} from database...`);

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('contact_id', contactId);

    if (error) {
      throw error;
    }

    log(`Retrieved ${calls.length} calls for contact ${contactId} from database`);
    return calls;
  } catch (error) {
    log(`Error fetching calls for contact ${contactId} from database: ${error.message}`);
    return [];
  }
}

/**
 * Main function to fetch and sync Vapi data for a specific phone number
 */
async function syncVapiDataForNumber(phoneNumber) {
  try {
    log(`Starting Vapi data sync process for phone number ${phoneNumber}...`);

    // Fetch all calls
    const allCalls = await fetchAllCalls();

    // Filter calls for the phone number
    const filteredCalls = filterCallsForPhoneNumber(allCalls, phoneNumber);

    if (filteredCalls.length === 0) {
      log(`No calls found for phone number ${phoneNumber}`);
      return;
    }

    log(`Processing ${filteredCalls.length} calls for phone number ${phoneNumber}...`);

    // Get or create contact
    const contact = await getOrCreateContact(phoneNumber);

    // Process each call
    let successCount = 0;
    let errorCount = 0;

    for (const call of filteredCalls) {
      try {
        // Fetch call details
        const callDetails = await fetchCallDetails(call.id);

        // Fetch call recording
        const recordingUrl = await fetchCallRecording(call.id);

        // Get recording URL from call details if not available
        let finalRecordingUrl = recordingUrl;
        if (!finalRecordingUrl && callDetails && callDetails.artifact) {
          finalRecordingUrl = callDetails.artifact.recordingUrl || callDetails.artifact.stereoRecordingUrl;
        }

        // Upsert call data to database
        const success = await upsertCallData(call, callDetails, finalRecordingUrl);

        if (success) {
          successCount++;
          log(`Successfully processed call ${call.id}`);
        } else {
          errorCount++;
          log(`Failed to process call ${call.id}`);
        }
      } catch (error) {
        log(`Error processing call ${call.id}: ${error.message}`);
        errorCount++;
      }
    }

    // Get all calls for the contact from the database
    const dbCalls = await getCallsForContact(contact.contact_id);

    // Update contact profile
    await updateContactProfile(contact.contact_id, dbCalls);

    log(`Vapi data sync completed for phone number ${phoneNumber}. Successfully processed ${successCount} calls. Errors: ${errorCount}`);
  } catch (error) {
    log(`Error syncing Vapi data for phone number ${phoneNumber}: ${error.message}`);
  } finally {
    // Close log stream
    logStream.end();
  }
}

// Run the sync for the target phone number
syncVapiDataForNumber(TARGET_PHONE_NUMBER);
