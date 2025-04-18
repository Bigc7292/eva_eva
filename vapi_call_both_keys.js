/**
 * VAPI Call - Try Both Keys
 *
 * This script tries both the public and private API keys to make a call.
 *
 * Usage:
 * node vapi_call_both_keys.js
 */

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PUBLIC_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';

// Your phone number to receive calls
const YOUR_PHONE_NUMBER = '+971565401583';

// Make a call using the public key
async function makeCallWithPublicKey() {
  console.log('Trying with PUBLIC API key...');
  try {
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PUBLIC_API_KEY}`
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        assistantId: VAPI_ASSISTANT_ID,
        phoneNumberId: PHONE_NUMBER_ID,
        customer: {
          number: YOUR_PHONE_NUMBER
        },
        name: `TestCall_Public_${Date.now()}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Call initiation failed with public key:', data);
      return null;
    }

    console.log('✅ Call initiated successfully with public key!');
    console.log('Call ID:', data.id);
    console.log('Initial status:', data.status);
    return data.id;
  } catch (error) {
    console.error('❌ Error making call with public key:', error);
    return null;
  }
}

// Make a call using the private key
async function makeCallWithPrivateKey() {
  console.log('Trying with PRIVATE API key...');
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
        name: `TestCall_Private_${Date.now()}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Call initiation failed with private key:', data);
      return null;
    }

    console.log('✅ Call initiated successfully with private key!');
    console.log('Call ID:', data.id);
    console.log('Initial status:', data.status);
    return data.id;
  } catch (error) {
    console.error('❌ Error making call with private key:', error);
    return null;
  }
}

// Check call status
async function checkCallStatus(callId, apiKey) {
  try {
    console.log(`Checking status for call ${callId}...`);

    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
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

// Main function
async function main() {
  console.log('=== VAPI Call Test (Both Keys) ===');
  console.log('Configuration:');
  console.log(`- Assistant ID: ${VAPI_ASSISTANT_ID}`);
  console.log(`- Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`- Your Phone Number: ${YOUR_PHONE_NUMBER}`);
  console.log('');

  // Try with public key first
  let callId = await makeCallWithPublicKey();
  let usedKey = PUBLIC_API_KEY;

  // If public key fails, try with private key
  if (!callId) {
    callId = await makeCallWithPrivateKey();
    usedKey = PRIVATE_API_KEY;
  }

  // If we have a call ID, check status after 10 seconds
  if (callId) {
    console.log('Waiting 10 seconds to check call status...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await checkCallStatus(callId, usedKey);
  } else {
    console.log('❌ Failed to initiate call with both keys.');
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
});
