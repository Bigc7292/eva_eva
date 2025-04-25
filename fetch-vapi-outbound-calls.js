const fetch = require('node-fetch');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_API_URL = 'https://api.vapi.ai';
const TARGET_PHONE_NUMBER = '+971565401583';

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to fetch calls with pagination
async function fetchAllCalls(cursor = null, allCalls = []) {
  const limit = 100;
  let url = `${VAPI_API_URL}/call?limit=${limit}`;
  
  if (cursor) {
    url += `&cursor=${cursor}`;
  }
  
  console.log(`Fetching calls from Vapi (cursor: ${cursor || 'initial'})...`);
  
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
  
  console.log(`Retrieved ${calls.length} calls from Vapi`);
  
  // Add calls to the result
  const updatedCalls = [...allCalls, ...calls];
  
  // Check if there are more calls to fetch
  if (data.next_cursor) {
    console.log(`More calls available, fetching next page with cursor: ${data.next_cursor}`);
    return fetchAllCalls(data.next_cursor, updatedCalls);
  }
  
  console.log(`Completed fetching all calls. Total calls: ${updatedCalls.length}`);
  return updatedCalls;
}

// Function to filter outbound calls for a specific phone number
function filterOutboundCallsForPhoneNumber(calls, phoneNumber) {
  const filteredCalls = calls.filter(call => {
    // Check if it's an outbound call
    if (call.type !== 'outboundPhoneCall') {
      return false;
    }
    
    // Check customer number (destination for outbound calls)
    if (call.customer && call.customer.number === phoneNumber) {
      return true;
    }
    
    // Check destination number
    if (call.destination && call.destination.number === phoneNumber) {
      return true;
    }
    
    return false;
  });
  
  console.log(`Found ${filteredCalls.length} outbound calls for phone number ${phoneNumber}`);
  return filteredCalls;
}

// Function to fetch call details
async function fetchCallDetails(callId) {
  console.log(`Fetching details for call ${callId}...`);
  
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
  console.log(`Successfully retrieved details for call ${callId}`);
  return data;
}

// Function to fetch call recording
async function fetchCallRecording(callId) {
  console.log(`Fetching recording for call ${callId}...`);
  
  const response = await fetch(`${VAPI_API_URL}/call/${callId}/recording`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`No recording available for call ${callId}: ${response.status} - ${errorText}`);
    return null;
  }

  const data = await response.json();
  console.log(`Successfully retrieved recording for call ${callId}: ${data.url}`);
  return data.url;
}

// Function to get or create a contact
async function getOrCreateContact(phoneNumber, name = null) {
  // Check if contact exists
  const { data: existingContacts, error: fetchError } = await supabase
    .from('contacts')
    .select('*')
    .eq('phone_number', phoneNumber);

  if (fetchError) {
    throw fetchError;
  }

  if (existingContacts && existingContacts.length > 0) {
    console.log(`Found existing contact for ${phoneNumber}: ${existingContacts[0].contact_id}`);
    return existingContacts[0];
  }

  // Create new contact
  console.log(`Creating new contact for ${phoneNumber}`);
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

  console.log(`Successfully created new contact: ${newContact.contact_id}`);
  return newContact;
}

// Function to upsert call data
async function upsertCallData(callData, callDetails, recordingUrl) {
  // Get or create contact
  const contact = await getOrCreateContact(TARGET_PHONE_NUMBER);
  
  // Extract transcript from call details
  let transcript = null;
  if (callDetails && callDetails.artifact && callDetails.artifact.transcript) {
    transcript = callDetails.artifact.transcript;
  }
  
  // Extract summary from call details
  let summary = null;
  if (callDetails && callDetails.analysis && callDetails.analysis.summary) {
    summary = callDetails.analysis.summary;
  }
  
  // Extract recording URL from call details if not provided
  let finalRecordingUrl = recordingUrl;
  if (!finalRecordingUrl && callDetails && callDetails.artifact) {
    finalRecordingUrl = callDetails.artifact.recordingUrl || callDetails.artifact.stereoRecordingUrl;
  }
  
  // Extract call data
  const callRecord = {
    call_id: callData.id,
    contact_id: contact.contact_id,
    call_status: callData.status || 'unknown',
    call_type: 'Outbound',
    start_time: callData.startedAt || new Date().toISOString(),
    end_time: callData.endedAt || null,
    duration: callData.durationSeconds || (callData.endedAt && callData.startedAt ? 
      (new Date(callData.endedAt) - new Date(callData.startedAt)) / 1000 : 0),
    recording_url: finalRecordingUrl || null,
    audio_url: finalRecordingUrl || null, // For consistency
    transcript: transcript,
    summary: summary,
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
    console.log(`Updating existing call ${callData.id}`);
    const { error: updateError } = await supabase
      .from('calls')
      .update(callRecord)
      .eq('call_id', callData.id);

    if (updateError) {
      throw updateError;
    }
    
    console.log(`Successfully updated call ${callData.id}`);
  } else {
    // Insert new call
    console.log(`Inserting new call ${callData.id}`);
    const { error: insertError } = await supabase
      .from('calls')
      .insert(callRecord);

    if (insertError) {
      throw insertError;
    }
    
    console.log(`Successfully inserted call ${callData.id}`);
  }

  return {
    success: true,
    call_id: callData.id,
    contact_id: contact.contact_id,
    transcript: transcript,
    summary: summary,
    audio_url: finalRecordingUrl
  };
}

// Function to update contact profile
async function updateContactProfile(contactId) {
  console.log(`Updating profile for contact ${contactId}...`);
  
  // Get all calls for the contact
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select('*')
    .eq('contact_id', contactId);
    
  if (callsError) {
    throw callsError;
  }
  
  if (!calls || calls.length === 0) {
    console.log(`No calls found for contact ${contactId}`);
    return false;
  }
  
  console.log(`Found ${calls.length} calls for contact ${contactId}`);
  
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
  
  console.log(`Successfully updated profile for contact ${contactId}`);
  console.log(`Added ${transcripts.length} transcripts, ${summaries.length} summaries, and ${audioFiles.length} audio files`);
  
  return true;
}

// Main function
async function main() {
  try {
    console.log(`Starting Vapi data sync process for outbound calls to ${TARGET_PHONE_NUMBER}...`);
    
    // Fetch all calls
    const allCalls = await fetchAllCalls();
    
    // Filter outbound calls for the target phone number
    const filteredCalls = filterOutboundCallsForPhoneNumber(allCalls, TARGET_PHONE_NUMBER);
    
    if (filteredCalls.length === 0) {
      console.log(`No outbound calls found for phone number ${TARGET_PHONE_NUMBER}`);
      return;
    }
    
    // Save the filtered calls to a file
    fs.writeFileSync('outbound-calls.json', JSON.stringify(filteredCalls, null, 2));
    console.log(`Saved ${filteredCalls.length} outbound calls to outbound-calls.json`);
    
    // Get or create contact
    const contact = await getOrCreateContact(TARGET_PHONE_NUMBER);
    
    // Process each call
    let successCount = 0;
    let errorCount = 0;
    
    for (const call of filteredCalls) {
      try {
        // Fetch call details
        const callDetails = await fetchCallDetails(call.id);
        
        // Fetch call recording
        const recordingUrl = await fetchCallRecording(call.id);
        
        // Upsert call data to database
        const result = await upsertCallData(call, callDetails, recordingUrl);
        
        if (result.success) {
          successCount++;
          console.log(`Successfully processed call ${call.id}`);
        } else {
          errorCount++;
          console.log(`Failed to process call ${call.id}`);
        }
      } catch (error) {
        console.error(`Error processing call ${call.id}:`, error);
        errorCount++;
      }
    }
    
    // Update contact profile
    await updateContactProfile(contact.contact_id);
    
    console.log(`Vapi data sync completed for outbound calls to ${TARGET_PHONE_NUMBER}.`);
    console.log(`Successfully processed ${successCount} calls. Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
