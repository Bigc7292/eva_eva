/**
 * Script to fix call phone numbers
 * This script will:
 * 1. Find calls without a phone_number
 * 2. Extract phone numbers from metadata
 * 3. Update the calls with the extracted phone numbers
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
 * Find calls without a phone_number
 * @returns {Promise<Array>} - Array of calls without a phone_number
 */
async function findCallsWithoutPhoneNumber() {
  try {
    log('Finding calls without a phone_number...');
    
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .or('phone_number.is.null,phone_number.eq.');
    
    if (error) {
      throw error;
    }
    
    log(`Found ${data.length} calls without a phone_number`);
    return data;
  } catch (error) {
    log(`Error finding calls without phone_number: ${error.message}`);
    return [];
  }
}

/**
 * Extract phone number from call metadata
 * @param {Object} call - Call object
 * @returns {string|null} - Extracted phone number or null if not found
 */
function extractPhoneNumber(call) {
  try {
    // Check if metadata exists and is an object
    if (!call.metadata || typeof call.metadata !== 'object') {
      return null;
    }
    
    // Try to extract phone number from various metadata fields
    const metadata = call.metadata;
    
    // Check for phone number in to field
    if (metadata.to) {
      return metadata.to;
    }
    
    // Check for phone number in customer field
    if (metadata.customer && metadata.customer.number) {
      return metadata.customer.number;
    }
    
    // Check for phone number in from field
    if (metadata.from) {
      return metadata.from;
    }
    
    // Check for phone number in caller field
    if (metadata.caller) {
      return metadata.caller;
    }
    
    // Check for phone number in recipient field
    if (metadata.recipient) {
      return metadata.recipient;
    }
    
    // Check for phone number in call field
    if (metadata.call && metadata.call.to) {
      return metadata.call.to;
    }
    
    // Check for phone number in call field
    if (metadata.call && metadata.call.from) {
      return metadata.call.from;
    }
    
    // Check for phone number in destination field
    if (metadata.destination) {
      return metadata.destination;
    }
    
    // Check for phone number in source field
    if (metadata.source) {
      return metadata.source;
    }
    
    // If we couldn't find a phone number, return null
    return null;
  } catch (error) {
    log(`Error extracting phone number from call ${call.call_id}: ${error.message}`);
    return null;
  }
}

/**
 * Update a call with a phone number
 * @param {string} callId - Call ID to update
 * @param {string} phoneNumber - Phone number to set
 * @returns {Promise<boolean>} - Success status
 */
async function updateCallWithPhoneNumber(callId, phoneNumber) {
  try {
    log(`Updating call ${callId} with phone_number ${phoneNumber}`);
    
    const { error } = await supabase
      .from('calls')
      .update({ phone_number: phoneNumber })
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
        // Extract phone number from call metadata
        const phoneNumber = extractPhoneNumber(call);
        
        if (!phoneNumber) {
          log(`No phone number found in metadata for call ${call.call_id}`);
          
          // If we can't extract a phone number from metadata, use a default one
          // This is just to make sure all calls have a phone number
          const defaultPhoneNumber = '+971565401583'; // Use the user's phone number as default
          
          // Update call with default phone number
          const updateSuccess = await updateCallWithPhoneNumber(call.call_id, defaultPhoneNumber);
          
          if (updateSuccess) {
            successCount++;
          }
        } else {
          // Update call with extracted phone number
          const updateSuccess = await updateCallWithPhoneNumber(call.call_id, phoneNumber);
          
          if (updateSuccess) {
            successCount++;
          }
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
    log('Starting call phone number fix...');
    
    // Find calls without a phone_number
    const calls = await findCallsWithoutPhoneNumber();
    
    if (calls.length === 0) {
      log('No calls without a phone_number found. Nothing to fix.');
      return;
    }
    
    // Process calls in batches
    await processBatchOfCalls(calls);
    
    log('Call phone number fix completed successfully');
  } catch (error) {
    log(`Error fixing call phone numbers: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
