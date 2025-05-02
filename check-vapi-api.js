/**
 * Script to check the Vapi API and print available calls
 */

const fetch = require('node-fetch');

// Vapi configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Check the Vapi API
 */
async function checkVapiApi() {
  try {
    log('Checking Vapi API...');

    // Try different endpoints
    const endpoints = [
      { name: 'calls', url: `${VAPI_API_URL}/call?limit=100` },
      { name: 'calls (v2)', url: `${VAPI_API_URL}/calls?limit=100` },
      { name: 'assistant calls', url: `${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}/calls?limit=100` }
    ];

    for (const endpoint of endpoints) {
      log(`Checking endpoint: ${endpoint.name} - ${endpoint.url}`);

      try {
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          log(`Error for ${endpoint.name}: ${response.status} - ${errorText}`);
          continue;
        }

        const data = await response.json();
        log(`Success for ${endpoint.name}:`);
        console.log(JSON.stringify(data, null, 2));
      } catch (endpointError) {
        log(`Error checking ${endpoint.name}: ${endpointError.message}`);
      }
    }

    // Check assistant details
    log(`Checking assistant details: ${VAPI_ASSISTANT_ID}`);
    try {
      const response = await fetch(`${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        log(`Error getting assistant details: ${response.status} - ${errorText}`);
      } else {
        const data = await response.json();
        log('Assistant details:');
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (assistantError) {
      log(`Error checking assistant: ${assistantError.message}`);
    }

    log('Vapi API check completed');
  } catch (error) {
    log(`Error checking Vapi API: ${error.message}`);
  }
}

// Run the check
checkVapiApi().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
