/**
 * Make VAPI Call
 *
 * This script makes a call using the VAPI API with the private key.
 *
 * Usage:
 * node make_call.js
 */

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const TWILIO_NUMBER = '+19143713101'; // Twilio/VAPI phone number

// Your phone number to receive calls
const YOUR_PHONE_NUMBER = '+971565401583';

// Make a call
async function makeCall() {
  console.log('=== Making VAPI Call ===');
  console.log(`From: ${TWILIO_NUMBER}`);
  console.log(`To: ${YOUR_PHONE_NUMBER}`);
  console.log(`Using assistant ID: ${VAPI_ASSISTANT_ID}`);
  console.log(`Using phone number ID: ${PHONE_NUMBER_ID}`);

  try {
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        assistantId: VAPI_ASSISTANT_ID,
        phoneNumberId: PHONE_NUMBER_ID,
        customer: {
          number: YOUR_PHONE_NUMBER
        },
        name: `Call_${Date.now()}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Call initiation failed:', data);
      return null;
    }

    console.log('✅ Call initiated successfully!');
    console.log('Call ID:', data.id);
    console.log('Initial status:', data.status);

    // Wait for 10 seconds then check call status
    console.log('Waiting 10 seconds to check call status...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check call status
    await checkCallStatus(data.id);

    return data.id;
  } catch (error) {
    console.error('❌ Error making call:', error);
    return null;
  }
}

// Check call status
async function checkCallStatus(callId) {
  try {
    console.log(`Checking status for call ${callId}...`);

    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error(`❌ Failed to get call status: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log('Call status:', data.status);
    console.log('Full call data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error checking call status:', error);
  }
}

// Run the script
makeCall().catch(error => {
  console.error('Unhandled error:', error);
});
