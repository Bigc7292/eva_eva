/**
 * Make VAPI Call
 * 
 * This script makes a direct API call to VAPI to initiate a call.
 * 
 * Usage:
 * node make_vapi_call.js
 */

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PUBLIC_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_ASSISTANT_ID = '209f26bc-b626-43c7-8815-779eff9712bb';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const TWILIO_NUMBER = '+19143713101'; // Twilio/VAPI phone number

// Your phone number to receive calls
const YOUR_PHONE_NUMBER = '+971565401583';

// Webhook URL for receiving events
const WEBHOOK_URL = 'https://webhook.site/6c094a7c-f31b-42e7-a887-614c6b9208a9';

// Make a call using the public API key
async function makeCallWithPublicKey() {
  console.log('Attempting to make call with public API key...');
  try {
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PUBLIC_API_KEY}`
      },
      body: JSON.stringify({
        assistant_id: VAPI_ASSISTANT_ID,
        to: YOUR_PHONE_NUMBER,
        from: TWILIO_NUMBER,
        phone_number_id: PHONE_NUMBER_ID,
        metadata: {
          test: true,
          source: 'make_vapi_call_script',
          timestamp: new Date().toISOString()
        }
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

// Make a call using the private API key
async function makeCallWithPrivateKey() {
  console.log('Attempting to make call with private API key...');
  try {
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        assistant_id: VAPI_ASSISTANT_ID,
        to: YOUR_PHONE_NUMBER,
        from: TWILIO_NUMBER,
        phone_number_id: PHONE_NUMBER_ID,
        metadata: {
          test: true,
          source: 'make_vapi_call_script',
          timestamp: new Date().toISOString()
        }
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
  console.log('=== VAPI Call Test ===');
  console.log('Configuration:');
  console.log(`- Assistant ID: ${VAPI_ASSISTANT_ID}`);
  console.log(`- Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`- Twilio Number: ${TWILIO_NUMBER}`);
  console.log(`- Your Phone Number: ${YOUR_PHONE_NUMBER}`);
  console.log(`- Webhook URL: ${WEBHOOK_URL}`);
  console.log('');
  
  // Try with public key first
  let callId = await makeCallWithPublicKey();
  
  // If public key fails, try with private key
  if (!callId) {
    callId = await makeCallWithPrivateKey();
  }
  
  // If we have a call ID, check status after 10 seconds
  if (callId) {
    console.log('Waiting 10 seconds to check call status...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Use the key that worked to check status
    const apiKey = callId ? (callId.startsWith('public_') ? PUBLIC_API_KEY : PRIVATE_API_KEY) : null;
    if (apiKey) {
      await checkCallStatus(callId, apiKey);
    }
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
});
