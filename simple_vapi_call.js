/**
 * Simple VAPI Call Script
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';

// Make a call
async function makeCall() {
  console.log('Starting call...');
  
  try {
    console.log(`Making call to: ${YOUR_PHONE_NUMBER}`);
    console.log(`Using assistant ID: ${VAPI_ASSISTANT_ID}`);
    
    const payload = {
      type: 'outboundPhoneCall',
      assistantId: VAPI_ASSISTANT_ID,
      phoneNumberId: PHONE_NUMBER_ID,
      customer: {
        number: YOUR_PHONE_NUMBER
      },
      name: `TestCall_${Date.now()}`
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Call initiated successfully!');
      console.log('Call ID:', data.id);
      console.log('Status:', data.status);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
    }
  } catch (error) {
    console.error('Error making call:', error);
  }
}

// Run the function
console.log('Script started');
makeCall().then(() => {
  console.log('Script completed');
}).catch(error => {
  console.error('Unhandled error:', error);
});
console.log('Script initiated');
