const fetch = require('node-fetch');
const fs = require('fs');

// Configuration
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_API_URL = 'https://api.vapi.ai';

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

// Main function
async function main() {
  try {
    console.log('Starting to fetch all calls from Vapi...');
    
    // Fetch all calls
    const allCalls = await fetchAllCalls();
    
    // Save the results to a file
    fs.writeFileSync('all-vapi-calls.json', JSON.stringify(allCalls, null, 2));
    
    console.log(`Total calls: ${allCalls.length}`);
    console.log('Results saved to all-vapi-calls.json');
    
    // Create a simple summary of the calls
    const summary = {
      totalCalls: allCalls.length,
      callsByType: {},
      callsByStatus: {},
      callsWithTranscript: 0,
      callsWithRecording: 0
    };
    
    // Count calls by type and status
    allCalls.forEach(call => {
      // Count by type
      const type = call.type || 'unknown';
      summary.callsByType[type] = (summary.callsByType[type] || 0) + 1;
      
      // Count by status
      const status = call.status || 'unknown';
      summary.callsByStatus[status] = (summary.callsByStatus[status] || 0) + 1;
      
      // Count calls with transcript
      if (call.artifact && call.artifact.transcript) {
        summary.callsWithTranscript++;
      }
      
      // Count calls with recording
      if (call.artifact && (call.artifact.recordingUrl || call.artifact.stereoRecordingUrl)) {
        summary.callsWithRecording++;
      }
    });
    
    // Save the summary to a file
    fs.writeFileSync('vapi-calls-summary.json', JSON.stringify(summary, null, 2));
    console.log('Summary saved to vapi-calls-summary.json');
    
    // Print the summary
    console.log('\nSummary:');
    console.log(`Total calls: ${summary.totalCalls}`);
    console.log('Calls by type:');
    Object.entries(summary.callsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log('Calls by status:');
    Object.entries(summary.callsByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log(`Calls with transcript: ${summary.callsWithTranscript}`);
    console.log(`Calls with recording: ${summary.callsWithRecording}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
