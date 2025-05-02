/**
 * Script to fix the association between calls and contacts (version 2)
 * This script will:
 * 1. Find calls without a contact_id
 * 2. Look up contacts by phone number
 * 3. Update the calls with the correct contact_id
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Normalize a phone number for consistent comparison
 * @param {string} phoneNumber - Phone number to normalize
 * @returns {string} - Normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If it's a valid international number (starts with country code)
  if (digitsOnly.length > 10) {
    // If it doesn't start with +, add it
    return digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;
  }
  
  // For US numbers without country code, add +1
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  
  // Return as is if we can't normalize it
  return phoneNumber;
}

/**
 * Find calls without a contact_id
 * @returns {Promise<Array>} - Array of calls without a contact_id
 */
async function findCallsWithoutContact() {
  try {
    log('Finding calls without a contact_id...');
    
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .is('contact_id', null);
    
    if (error) {
      throw error;
    }
    
    log(`Found ${data.length} calls without a contact_id`);
    return data;
  } catch (error) {
    log(`Error finding calls without contact_id: ${error.message}`);
    return [];
  }
}

/**
 * Find a contact by phone number
 * @param {string} phoneNumber - Phone number to search for
 * @returns {Promise<Object|null>} - Contact object or null if not found
 */
async function findContactByPhone(phoneNumber) {
  try {
    if (!phoneNumber) return null;
    
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    log(`Looking for contact with phone number: ${normalizedPhone}`);
    
    // Try to find the contact by phone_number
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (data) {
      log(`Found contact: ${data.contact_id} (${data.name})`);
      return data;
    }
    
    log(`No contact found for phone number: ${normalizedPhone}`);
    return null;
  } catch (error) {
    log(`Error finding contact by phone: ${error.message}`);
    return null;
  }
}

/**
 * Create a new contact for a phone number
 * @param {string} phoneNumber - Phone number for the new contact
 * @returns {Promise<Object|null>} - New contact object or null if creation failed
 */
async function createContactForPhone(phoneNumber) {
  try {
    if (!phoneNumber) return null;
    
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    log(`Creating new contact for phone number: ${normalizedPhone}`);
    
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        name: `Contact ${normalizedPhone}`,
        phone_number: normalizedPhone,
        transcripts: [],
        summaries: [],
        audio_files: []
      }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    log(`Created new contact: ${data.contact_id}`);
    return data;
  } catch (error) {
    log(`Error creating contact for phone ${phoneNumber}: ${error.message}`);
    return null;
  }
}

/**
 * Update a call with a contact_id
 * @param {string} callId - Call ID to update
 * @param {string} contactId - Contact ID to associate with the call
 * @returns {Promise<boolean>} - Success status
 */
async function updateCallWithContact(callId, contactId) {
  try {
    log(`Updating call ${callId} with contact_id ${contactId}`);
    
    const { error } = await supabase
      .from('calls')
      .update({ contact_id: contactId })
      .eq('call_id', callId);
    
    if (error) {
      throw error;
    }
    
    log(`Successfully updated call ${callId}`);
    return true;
  } catch (error) {
    log(`Error updating call ${callId}: ${error.message}`);
    return false;
  }
}

/**
 * Update contact profile with call data
 * @param {string} contactId - Contact ID to update
 * @param {Object} call - Call data
 * @returns {Promise<boolean>} - Success status
 */
async function updateContactWithCallData(contactId, call) {
  try {
    log(`Updating contact ${contactId} with call data from ${call.call_id}`);
    
    // Get current contact data
    const { data: contact, error: getError } = await supabase
      .from('contacts')
      .select('*')
      .eq('contact_id', contactId)
      .single();
    
    if (getError) {
      throw getError;
    }
    
    // Update arrays
    const transcripts = Array.isArray(contact.transcripts) ? contact.transcripts : [];
    const summaries = Array.isArray(contact.summaries) ? contact.summaries : [];
    const audioFiles = Array.isArray(contact.audio_files) ? contact.audio_files : [];
    
    // Add new data if available
    if (call.transcript) {
      transcripts.push({
        call_id: call.call_id,
        timestamp: call.start_time || new Date().toISOString(),
        text: call.transcript
      });
    }
    
    if (call.summary) {
      summaries.push({
        call_id: call.call_id,
        timestamp: call.start_time || new Date().toISOString(),
        text: call.summary
      });
    }
    
    if (call.recording_url || call.audio_url) {
      audioFiles.push({
        call_id: call.call_id,
        timestamp: call.start_time || new Date().toISOString(),
        url: call.recording_url || call.audio_url
      });
    }
    
    // Update contact
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        transcripts,
        summaries,
        audio_files: audioFiles,
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', contactId);
    
    if (updateError) {
      throw updateError;
    }
    
    log(`Successfully updated contact ${contactId}`);
    return true;
  } catch (error) {
    log(`Error updating contact ${contactId}: ${error.message}`);
    return false;
  }
}

/**
 * Process calls in batches
 * @param {Array} calls - Array of calls to process
 * @param {number} batchSize - Number of calls to process in each batch
 * @returns {Promise<void>}
 */
async function processBatchOfCalls(calls, batchSize = 10) {
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
        // Extract phone number from call data
        const phoneNumber = call.phone_number || 
                           (call.metadata && call.metadata.to) || 
                           (call.metadata && call.metadata.customer && call.metadata.customer.number);
        
        if (!phoneNumber) {
          log(`No phone number found for call ${call.call_id}`);
          processedCount++;
          continue;
        }
        
        // Find or create contact
        let contact = await findContactByPhone(phoneNumber);
        
        if (!contact) {
          contact = await createContactForPhone(phoneNumber);
          
          if (!contact) {
            log(`Failed to create contact for call ${call.call_id}`);
            processedCount++;
            continue;
          }
        }
        
        // Update call with contact_id
        const callUpdateSuccess = await updateCallWithContact(call.call_id, contact.contact_id);
        
        // Update contact with call data
        if (callUpdateSuccess) {
          await updateContactWithCallData(contact.contact_id, call);
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
    log('Starting call-contact association fix...');
    
    // Find calls without a contact_id
    const calls = await findCallsWithoutContact();
    
    if (calls.length === 0) {
      log('No calls without a contact_id found. Nothing to fix.');
      return;
    }
    
    // Process calls in batches
    await processBatchOfCalls(calls);
    
    log('Call-contact association fix completed successfully');
  } catch (error) {
    log(`Error fixing call-contact association: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
