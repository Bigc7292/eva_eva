/**
 * VAPI Direct Test Script
 *
 * This script makes a direct API call to VAPI to test call functionality
 * without requiring ngrok or other tools.
 *
 * Usage:
 * node vapi_direct_test.js
 */

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8'; // Public key for making calls
const PRIVATE_VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private key for admin operations
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const TWILIO_NUMBER = '+19143713101'; // Twilio/VAPI phone number

// Webhook URL for receiving events
const WEBHOOK_URL = 'https://webhook.site/6c094a7c-f31b-42e7-a887-614c6b9208a9';

// Test phone number to call
const TEST_PHONE_NUMBER = '+971565401583'; // Your number to receive calls

// Make a test call
async function makeTestCall() {
  try {
    console.log('=== VAPI Direct Test ===');
    console.log('Initiating test call to:', TEST_PHONE_NUMBER);
    console.log('Using Twilio number:', TWILIO_NUMBER);
    console.log('Using phone number ID:', PHONE_NUMBER_ID);
    console.log('Using assistant ID:', VAPI_ASSISTANT_ID);

    // Make the API call
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_VAPI_API_KEY}`
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        assistantId: VAPI_ASSISTANT_ID,
        phoneNumberId: PHONE_NUMBER_ID,
        customer: {
          number: TEST_PHONE_NUMBER
        },
        name: `TestCall_${Date.now()}`,
        metadata: {
          test: true,
          source: 'vapi_direct_test',
          timestamp: new Date().toISOString()
        }
      })
    });

    // Parse the response
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Call initiation failed:', data);
      return;
    }

    console.log('✅ Call initiated successfully!');
    console.log('Call ID:', data.id);
    console.log('Initial status:', data.status);

    // Wait for 10 seconds then check call status
    console.log('Waiting 10 seconds to check call status...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check call status
    const statusResponse = await fetch(`${VAPI_API_URL}/call/${data.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_VAPI_API_KEY}`
      }
    });

    if (!statusResponse.ok) {
      console.error('❌ Failed to get call status:', await statusResponse.text());
      return;
    }

    const statusData = await statusResponse.json();
    console.log('Call status after 10 seconds:', statusData.status);
    console.log('Full call data:', JSON.stringify(statusData, null, 2));

  } catch (error) {
    console.error('❌ Error making test call:', error);
  }
}

// Run the test
makeTestCall();
