const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch all calls from Vapi
 */
async function fetchAllCalls() {
  try {
    console.log('Fetching all calls from Vapi...');
    
    const response = await fetch(`${VAPI_API_URL}/call?limit=100`, {
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
    console.log(`Retrieved ${data.calls.length} calls from Vapi`);
    return data.calls;
  } catch (error) {
    console.error('Error fetching calls:', error);
    throw error;
  }
}

/**
 * Fetch call details from Vapi
 */
async function fetchCallDetails(callId) {
  try {
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
    return data;
  } catch (error) {
    console.error(`Error fetching call details for ${callId}:`, error);
    return null;
  }
}

/**
 * Fetch call recording from Vapi
 */
async function fetchCallRecording(callId) {
  try {
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
      console.warn(`No recording available for call ${callId}: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error(`Error fetching recording for ${callId}:`, error);
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
      console.log(`Found existing contact for ${phoneNumber}`);
      return existingContacts[0];
    }

    // Create new contact
    console.log(`Creating new contact for ${phoneNumber}`);
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        phone_number: phoneNumber,
        name: name || `Contact ${phoneNumber}`,
        status: 'new'
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return newContact;
  } catch (error) {
    console.error(`Error managing contact for ${phoneNumber}:`, error);
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
      console.log(`Updating existing call ${callData.id}`);
      const { error: updateError } = await supabase
        .from('calls')
        .update(callRecord)
        .eq('call_id', callData.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new call
      console.log(`Inserting new call ${callData.id}`);
      const { error: insertError } = await supabase
        .from('calls')
        .insert(callRecord);

      if (insertError) {
        throw insertError;
      }
    }

    return true;
  } catch (error) {
    console.error(`Error upserting call data for ${callData.id}:`, error);
    return false;
  }
}

/**
 * Main function to fetch and sync all Vapi data
 */
async function syncVapiData() {
  try {
    // Fetch all calls
    const calls = await fetchAllCalls();
    
    // Process each call
    for (const call of calls) {
      try {
        // Fetch call details
        const callDetails = await fetchCallDetails(call.id);
        
        // Fetch call recording
        const recordingUrl = await fetchCallRecording(call.id);
        
        // Upsert call data to database
        await upsertCallData(call, callDetails, recordingUrl);
        
        console.log(`Successfully processed call ${call.id}`);
      } catch (error) {
        console.error(`Error processing call ${call.id}:`, error);
      }
    }
    
    console.log('Vapi data sync completed successfully!');
  } catch (error) {
    console.error('Error syncing Vapi data:', error);
  }
}

// Run the sync
syncVapiData();
