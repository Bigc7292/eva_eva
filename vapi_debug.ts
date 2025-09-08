/**
 * VAPI Debug Script
 * This script provides comprehensive debugging for VAPI integration
 *
 * To run:
 * 1. Make sure you have Node.js installed
 * 2. Run: npx ts-node vapi_debug.ts
 */

// Define interfaces for TypeScript
interface VapiCallResponse {
  id: string;
  status: string;
  assistant_id: string;
  to: string;
  from?: string;
  phone_number_id?: string;
  [key: string]: unknown; // Allow other properties
}

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8'; // Public key
const PRIVATE_VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private key
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const TWILIO_NUMBER = '+19143713101'; // Twilio/VAPI phone number
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f'; // Phone number ID

// Test phone number to call
const TEST_PHONE_NUMBER = '+971565401583'; // Your number to receive calls

// Debug options
const DEBUG_OPTIONS = {
  checkAssistant: true,
  checkPhoneNumber: true,
  checkServerUrls: true,
  makeTestCall: true,
  waitForStatus: true,
  waitTimeSeconds: 20
};

// Server URL to use for webhooks
// Using the webhook.site URL provided by the user
const SERVER_URL = 'https://webhook.site/6c094a7c-f31b-42e7-a887-614c6b9208a9';

// Replace the above URL with your actual public URL when available
// For example: 'https://your-domain.com/api/webhooks/vapi'

// Main debug function
async function debugVapiIntegration() {
  console.log('=== VAPI Integration Debug ===');
  console.log('Configuration:');
  console.log(`- API URL: ${VAPI_API_URL}`);
  console.log(`- Assistant ID: ${VAPI_ASSISTANT_ID}`);
  console.log(`- Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`- Twilio Number: ${TWILIO_NUMBER}`);
  console.log(`- Test Phone Number: ${TEST_PHONE_NUMBER}`);
  console.log(`- Server URL: ${SERVER_URL}`);
  console.log('');

  // Check assistant
  if (DEBUG_OPTIONS.checkAssistant) {
    await checkAssistant();
  }

  // Check phone number
  if (DEBUG_OPTIONS.checkPhoneNumber) {
    await checkPhoneNumber();
  }

  // Check server URLs
  if (DEBUG_OPTIONS.checkServerUrls) {
    await checkServerUrls();
  }

  // Make test call
  if (DEBUG_OPTIONS.makeTestCall) {
    await makeTestCall();
  }
}

// Check assistant configuration
async function checkAssistant() {
  try {
    console.log('Checking assistant configuration...');

    const response = await fetch(`${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error(`❌ Assistant check failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }

    const data = await response.json() as { id: string; name: string; status: string };
    console.log(`✅ Assistant found: ${data.name} (${data.id})`);
    console.log(`Status: ${data.status}`);

    if (data.status !== 'published') {
      console.warn('⚠️ Warning: Assistant is not published. Calls may not work correctly.');
    }

    console.log('');
  } catch (error) {
    console.error('❌ Error checking assistant:', error);
    console.log('');
  }
}

// Check phone number configuration
async function checkPhoneNumber() {
  try {
    console.log('Checking phone number configuration...');

    const response = await fetch(`${VAPI_API_URL}/phone-number/${PHONE_NUMBER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error(`❌ Phone number check failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }

    const data = await response.json() as { id: string; phone_number: string; status: string };
    console.log(`✅ Phone number found: ${data.phone_number} (${data.id})`);
    console.log(`Status: ${data.status}`);

    if (data.status !== 'active') {
      console.warn('⚠️ Warning: Phone number is not active. Calls may not work correctly.');
    }

    console.log('');
  } catch (error) {
    console.error('❌ Error checking phone number:', error);
    console.log('');
  }
}

// Make a test call
async function makeTestCall() {
  try {
    console.log('Initiating test call...');
    console.log(`From: ${TWILIO_NUMBER}`);
    console.log(`To: ${TEST_PHONE_NUMBER}`);
    console.log(`Using phone number ID: ${PHONE_NUMBER_ID}`);
    console.log(`Using assistant ID: ${VAPI_ASSISTANT_ID}`);

    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        assistant_id: VAPI_ASSISTANT_ID,
        to: TEST_PHONE_NUMBER,
        from: TWILIO_NUMBER,
        phone_number_id: PHONE_NUMBER_ID,
        metadata: {
          debug: true,
          source: 'vapi_debug_script',
          timestamp: new Date().toISOString()
        }
      })
    });

    const data = await response.json() as VapiCallResponse;

    if (!response.ok) {
      console.error('❌ Call initiation failed:', data);
      return;
    }

    console.log('✅ Call initiated successfully!');
    console.log(`Call ID: ${data.id}`);
    console.log(`Initial status: ${data.status}`);

    // Wait for call status updates
    if (DEBUG_OPTIONS.waitForStatus && data.id) {
      await waitForCallStatus(data.id);
    }

  } catch (error) {
    console.error('❌ Error making test call:', error);
  }
}

// Check server URLs configuration
async function checkServerUrls() {
  try {
    console.log('Checking server URLs configuration...');

    // Check assistant server URL
    console.log('Checking assistant server URL...');
    const assistantResponse = await fetch(`${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`
      }
    });

    if (!assistantResponse.ok) {
      console.error(`❌ Failed to get assistant: ${assistantResponse.status} ${assistantResponse.statusText}`);
      return;
    }

    const assistantData = await assistantResponse.json() as { serverUrl?: string };

    if (assistantData.serverUrl) {
      console.log(`✅ Assistant server URL is set: ${assistantData.serverUrl}`);

      if (assistantData.serverUrl !== SERVER_URL) {
        console.warn(`⚠️ Assistant server URL doesn't match our expected URL: ${SERVER_URL}`);
        console.log('Updating assistant server URL...');
        await updateAssistantServerUrl();
      }
    } else {
      console.warn('⚠️ Assistant server URL is not set');
      console.log('Setting assistant server URL...');
      await updateAssistantServerUrl();
    }

    // Check phone number server URL
    console.log('\nChecking phone number server URL...');
    const phoneResponse = await fetch(`${VAPI_API_URL}/phone-number/${PHONE_NUMBER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`
      }
    });

    if (!phoneResponse.ok) {
      console.error(`❌ Failed to get phone number: ${phoneResponse.status} ${phoneResponse.statusText}`);
      return;
    }

    const phoneData = await phoneResponse.json() as { serverUrl?: string };

    if (phoneData.serverUrl) {
      console.log(`✅ Phone number server URL is set: ${phoneData.serverUrl}`);

      if (phoneData.serverUrl !== SERVER_URL) {
        console.warn(`⚠️ Phone number server URL doesn't match our expected URL: ${SERVER_URL}`);
        console.log('Updating phone number server URL...');
        await updatePhoneNumberServerUrl();
      }
    } else {
      console.warn('⚠️ Phone number server URL is not set');
      console.log('Setting phone number server URL...');
      await updatePhoneNumberServerUrl();
    }

    console.log('');
  } catch (error) {
    console.error('❌ Error checking server URLs:', error);
    console.log('');
  }
}

// Update assistant server URL
async function updateAssistantServerUrl() {
  try {
    const response = await fetch(`${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: SERVER_URL
      })
    });

    if (!response.ok) {
      console.error(`❌ Failed to update assistant server URL: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }

    console.log('✅ Assistant server URL updated successfully');
  } catch (error) {
    console.error('❌ Error updating assistant server URL:', error);
  }
}

// Update phone number server URL
async function updatePhoneNumberServerUrl() {
  try {
    const response = await fetch(`${VAPI_API_URL}/phone-number/${PHONE_NUMBER_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: SERVER_URL
      })
    });

    if (!response.ok) {
      console.error(`❌ Failed to update phone number server URL: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }

    console.log('✅ Phone number server URL updated successfully');
  } catch (error) {
    console.error('❌ Error updating phone number server URL:', error);
  }
}

// Wait for call status updates
async function waitForCallStatus(callId: string) {
  console.log(`Waiting ${DEBUG_OPTIONS.waitTimeSeconds} seconds for call status updates...`);

  // Check status every 5 seconds
  const intervalMs = 5000;
  const iterations = Math.floor((DEBUG_OPTIONS.waitTimeSeconds * 1000) / intervalMs);

  for (let i = 0; i < iterations; i++) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));

    try {
      const statusResponse = await fetch(`${VAPI_API_URL}/call/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      });

      if (!statusResponse.ok) {
        console.error(`❌ Failed to get call status: ${statusResponse.status} ${statusResponse.statusText}`);
        continue;
      }

      const statusData = await statusResponse.json() as VapiCallResponse;
      const elapsedSeconds = ((i + 1) * intervalMs) / 1000;
      console.log(`[${elapsedSeconds}s] Call status: ${statusData.status}`);

      // If call is completed or failed, break early
      if (['completed', 'failed', 'error'].includes(statusData.status)) {
        console.log('Call has reached a final state. Details:');
        console.log(JSON.stringify(statusData, null, 2));
        break;
      }
    } catch (error) {
      console.error(`❌ Error checking call status at ${((i + 1) * intervalMs) / 1000}s:`, error);
    }
  }

  console.log('Status check complete.');
}

// Run the debug
debugVapiIntegration().catch(error => {
  console.error('Unhandled error in debug script:', error);
});
