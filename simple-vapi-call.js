/**
 * Simple VAPI Call
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
      
      // Wait 10 seconds and check status
      console.log('Waiting 10 seconds to check status...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check status
      await checkStatus(data.id);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
    }
  } catch (error) {
    console.error('Error making call:', error);
  }
}

// Check call status
async function checkStatus(callId) {
  try {
    console.log(`Checking status for call ${callId}...`);
    
    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('Current status:', data.status);
    console.log('Full data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

// Run the function
console.log('Script started');
makeCall().then(() => {
  console.log('Script completed');
}).catch(error => {
  console.error('Unhandled error:', error);
});
