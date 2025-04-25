const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Possible paths to the JSON file
const possiblePaths = [
  'vapi-all-calls.json',
  'all-vapi-calls.json',
  'outbound-calls.json',
  'vapi-calls.json',
  'calls.json',
  path.join(__dirname, 'vapi-all-calls.json'),
  path.join(__dirname, 'all-vapi-calls.json'),
  path.join(__dirname, 'outbound-calls.json'),
  path.join(__dirname, 'vapi-calls.json'),
  path.join(__dirname, 'calls.json'),
  path.join(process.cwd(), 'vapi-all-calls.json'),
  path.join(process.cwd(), 'all-vapi-calls.json'),
  path.join(process.cwd(), 'outbound-calls.json'),
  path.join(process.cwd(), 'vapi-calls.json'),
  path.join(process.cwd(), 'calls.json')
];

// Find the first existing file
let JSON_FILE_PATH = null;
for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    JSON_FILE_PATH = filePath;
    log(`Found JSON file at: ${filePath}`);
    break;
  }
}

if (!JSON_FILE_PATH) {
  console.error('Could not find the JSON file. Please provide the path to the file as a command-line argument.');
  console.error('Example: node import-vapi-calls.js path/to/vapi-calls.json');

  // Check if a file path was provided as a command-line argument
  if (process.argv.length > 2) {
    const argPath = process.argv[2];
    if (fs.existsSync(argPath)) {
      JSON_FILE_PATH = argPath;
      log(`Using file path from command-line argument: ${argPath}`);
    } else {
      console.error(`File not found: ${argPath}`);
      process.exit(1);
    }
  } else {
    // Ask for file path
    console.error('Please enter the full path to the JSON file:');
    process.exit(1);
  }
}

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

// Function to process a call
async function processCall(call) {
  try {
    // Skip if not an outbound call to the target phone number
    if (call.type !== 'outboundPhoneCall') {
      return { success: false, reason: 'Not an outbound call' };
    }

    if (!call.customer || call.customer.number !== TARGET_PHONE_NUMBER) {
      return { success: false, reason: 'Not for target phone number' };
    }

    log(`Processing call ${call.id} for ${TARGET_PHONE_NUMBER}...`);

    // Get or create contact
    const contact = await getOrCreateContact(TARGET_PHONE_NUMBER);

    // Extract transcript from call
    let transcript = null;
    if (call.artifact && call.artifact.transcript) {
      transcript = call.artifact.transcript;
    }

    // Extract summary from call
    let summary = null;
    if (call.analysis && call.analysis.summary) {
      summary = call.analysis.summary;
    }

    // Extract recording URL from call
    let recordingUrl = null;
    if (call.artifact) {
      recordingUrl = call.artifact.recordingUrl || call.artifact.stereoRecordingUrl;
    }

    // Extract call data
    const callRecord = {
      call_id: call.id,
      contact_id: contact.contact_id,
      call_status: call.status || 'unknown',
      call_type: 'Outbound',
      start_time: call.startedAt || new Date().toISOString(),
      end_time: call.endedAt || null,
      duration: call.durationSeconds || (call.endedAt && call.startedAt ?
        (new Date(call.endedAt) - new Date(call.startedAt)) / 1000 : 0),
      recording_url: recordingUrl || null,
      audio_url: recordingUrl || null, // For consistency
      transcript: transcript,
      summary: summary,
      metadata: call,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if call exists
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', call.id);

    if (fetchError) {
      throw fetchError;
    }

    if (existingCall && existingCall.length > 0) {
      // Update existing call
      log(`Updating existing call ${call.id}`);
      const { error: updateError } = await supabase
        .from('calls')
        .update(callRecord)
        .eq('call_id', call.id);

      if (updateError) {
        throw updateError;
      }

      log(`Successfully updated call ${call.id}`);
    } else {
      // Insert new call
      log(`Inserting new call ${call.id}`);
      const { error: insertError } = await supabase
        .from('calls')
        .insert(callRecord);

      if (insertError) {
        throw insertError;
      }

      log(`Successfully inserted call ${call.id}`);
    }

    return {
      success: true,
      call_id: call.id,
      contact_id: contact.contact_id,
      transcript: transcript,
      summary: summary,
      audio_url: recordingUrl
    };
  } catch (error) {
    log(`Error processing call ${call.id}: ${error.message}`);
    return {
      success: false,
      call_id: call.id,
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
      .eq('contact_id', contactId);

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
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        transcripts: transcripts,
        summaries: summaries,
        audio_files: audioFiles,
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', contactId);

    if (updateError) {
      throw updateError;
    }

    log(`Successfully updated profile for contact ${contactId}`);
    log(`Added ${transcripts.length} transcripts, ${summaries.length} summaries, and ${audioFiles.length} audio files`);

    return true;
  } catch (error) {
    log(`Error updating profile for contact ${contactId}: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    log('Starting to import Vapi calls from JSON file...');

    // Check if the file exists
    if (!fs.existsSync(JSON_FILE_PATH)) {
      throw new Error(`File not found: ${JSON_FILE_PATH}`);
    }

    // Read the JSON file
    const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    const data = JSON.parse(fileContent);

    // Extract calls from the data
    let calls = [];
    if (data.calls) {
      // Format from the HTML page
      calls = data.calls;
    } else if (Array.isArray(data)) {
      // Format from direct API call
      calls = data;
    } else {
      throw new Error('Invalid JSON format: could not find calls array');
    }

    log(`Found ${calls.length} calls in the JSON file`);

    // Process each call
    let successCount = 0;
    let errorCount = 0;
    let contactId = null;

    for (const call of calls) {
      try {
        const result = await processCall(call);

        if (result.success) {
          successCount++;
          contactId = result.contact_id;
        } else {
          errorCount++;
        }
      } catch (error) {
        log(`Error processing call: ${error.message}`);
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
