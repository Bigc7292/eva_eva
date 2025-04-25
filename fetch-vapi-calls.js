const fetch = require('node-fetch');
const fs = require('fs');

// Configuration
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_API_URL = 'https://api.vapi.ai';
const TARGET_PHONE_NUMBER = '+971565401583';

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

// Function to filter calls for a specific phone number
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
  
  console.log(`Found ${filteredCalls.length} calls for phone number ${phoneNumber}`);
  return filteredCalls;
}

// Main function
async function main() {
  try {
    // Fetch all calls
    const allCalls = await fetchAllCalls();
    
    // Filter calls for the target phone number
    const filteredCalls = filterCallsForPhoneNumber(allCalls, TARGET_PHONE_NUMBER);
    
    // Save the results to a file
    fs.writeFileSync('all-calls.json', JSON.stringify(allCalls, null, 2));
    fs.writeFileSync('filtered-calls.json', JSON.stringify(filteredCalls, null, 2));
    
    console.log(`Total calls: ${allCalls.length}`);
    console.log(`Calls for ${TARGET_PHONE_NUMBER}: ${filteredCalls.length}`);
    console.log('Results saved to all-calls.json and filtered-calls.json');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
