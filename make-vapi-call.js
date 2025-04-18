/**
 * Make a VAPI Call
 *
 * This script makes a call using the VAPI API following their documentation
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const WALLET_ID = 'bc24330e-70f5-4508-9370-dbbd56fb3bfa';

/**
 * Make a call using VAPI
 */
async function makeCall() {
  try {
    console.log('=== Making VAPI Call ===');
    console.log(`To: ${YOUR_PHONE_NUMBER}`);
    console.log(`Using assistant ID: ${ASSISTANT_ID}`);
    console.log(`Using phone number ID: ${PHONE_NUMBER_ID}`);

    // Create the request payload exactly as shown in the documentation
    const payload = {
      assistant_id: ASSISTANT_ID,
      to: YOUR_PHONE_NUMBER,
      phone_number_id: PHONE_NUMBER_ID,
      org_id: ORGANIZATION_ID,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        wallet_id: WALLET_ID
      }
    };

    console.log('\nRequest payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('\nResponse status:', response.status);

    try {
      const data = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log('\n✅ Call initiated successfully!');
        console.log('Call ID:', data.id);
        console.log('Status:', data.status);

        // Wait for 10 seconds then check call status
        console.log('\nWaiting 10 seconds to check call status...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Check call status
        await checkCallStatus(data.id);
      } else {
        console.error('\n❌ Call initiation failed:', data);
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      console.log('Raw response:', responseText);
    }
  } catch (error) {
    console.error('Error making call:', error);
  }
}

/**
 * Check call status
 */
async function checkCallStatus(callId) {
  try {
    console.log(`\nChecking status for call ${callId}...`);

    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error checking call status: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('Current status:', data.status);
    console.log('Full call data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error checking call status:', error);
  }
}

// Run the script
console.log('Starting VAPI call script...');
makeCall().then(() => {
  console.log('\nScript completed.');
}).catch(error => {
  console.error('Unhandled error:', error);
});
