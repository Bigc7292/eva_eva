/**
 * VAPI Test Script
 * This script can be used to test VAPI integration directly
 *
 * To run:
 * 1. Make sure you have Node.js installed
 * 2. Run: npx ts-node vapi_test.ts
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

// VAPI Configuration - Moved to separate variables to avoid conflicts with vapi_debug.ts
const TEST_VAPI_API_URL = 'https://api.vapi.ai';
const TEST_VAPI_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8'; // Public key
const TEST_VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const TEST_TWILIO_NUMBER = '+19143713101'; // Twilio/VAPI phone number
const TEST_PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f'; // Phone number ID

// Test phone number to call
const TEST_TARGET_PHONE = '+971565401583'; // Your number to receive calls

// Function to make a test call
async function makeTestCall() {
  try {
    console.log('Initiating test call to:', TEST_TARGET_PHONE);
    console.log('Using Twilio number:', TEST_TWILIO_NUMBER);
    console.log('Using phone number ID:', TEST_PHONE_NUMBER_ID);
    console.log('Using assistant ID:', TEST_VAPI_ASSISTANT_ID);

    const response = await fetch(`${TEST_VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_VAPI_API_KEY}`
      },
      body: JSON.stringify({
        assistant_id: TEST_VAPI_ASSISTANT_ID,
        to: TEST_TARGET_PHONE,
        from: TEST_TWILIO_NUMBER,
        phone_number_id: TEST_PHONE_NUMBER_ID, // Add phone number ID
        metadata: {
          test: true,
          source: 'vapi_test_script',
          timestamp: new Date().toISOString()
        }
      })
    });

    const data = await response.json() as VapiCallResponse;

    if (!response.ok) {
      console.error('VAPI API error:', data);
      return;
    }

    console.log('Call initiated successfully:', data);
    console.log('Call ID:', data.id);

    // Wait for 10 seconds then check call status
    console.log('Waiting 10 seconds to check call status...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check call status
    const statusResponse = await fetch(`${TEST_VAPI_API_URL}/call/${data.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_VAPI_API_KEY}`
      }
    });

    const statusData = await statusResponse.json() as VapiCallResponse;
    console.log('Call status after 10 seconds:', statusData.status);
    console.log('Full call data:', statusData);

  } catch (error) {
    console.error('Error making test call:', error);
  }
}

// Run the test
makeTestCall();