/**
 * Test Call Script
 *
 * This script initiates a test call using VAPI
 * It uses the private API key to make an outbound call
 */

// Load environment variables from .env file
require('dotenv').config();

// VAPI configuration
const VAPI_API_URL = process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai';
const PRIVATE_API_KEY = process.env.NEXT_PRIVATE_VAPI_API_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738'; // Correct assistant ID
const PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID || '53cb46fd-5e37-4860-8668-7594005f872a'; // Updated phone number ID from logs

// Check if required environment variables are set
if (!PRIVATE_API_KEY) {
  console.error('Missing VAPI private API key');
  process.exit(1);
}

if (!ASSISTANT_ID) {
  console.error('Missing VAPI assistant ID');
  process.exit(1);
}

// Phone number to call (use your own phone number for testing)
const PHONE_NUMBER = process.argv[2] || '+971565401583'; // Default to your number if none provided

// Make the call
async function makeCall() {
  try {
    console.log(`Making test call to ${PHONE_NUMBER} using VAPI...`);
    console.log(`Assistant ID: ${ASSISTANT_ID}`);
    console.log(`Phone Number ID: ${PHONE_NUMBER_ID}`);
    console.log(`API URL: ${VAPI_API_URL}`);
    console.log(`Private API Key: ${PRIVATE_API_KEY ? PRIVATE_API_KEY.substring(0, 5) + '...' : 'Not set'}`);

    // Log the request payload
    const payload = {
      type: 'outboundPhoneCall',
      assistantId: ASSISTANT_ID,
      customer: {
        number: PHONE_NUMBER
      },
      phoneNumberId: PHONE_NUMBER_ID,
      metadata: {
        source: 'test-call',
        timestamp: new Date().toISOString()
      }
    };
    console.log('Request payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${VAPI_API_URL}/call/phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        assistantId: ASSISTANT_ID,
        customer: {
          number: PHONE_NUMBER
        },
        phoneNumberId: PHONE_NUMBER_ID,
        metadata: {
          source: 'test-call',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error making call: ${response.status} - ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('Call initiated successfully!');
    console.log('Call ID:', data.id);
    console.log('Status:', data.status);
    console.log('Full response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error making call:', error);
    process.exit(1);
  }
}

// Run the function
makeCall();
