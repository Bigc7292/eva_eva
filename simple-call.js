/**
 * Simple Test Call Script
 */

// VAPI configuration - hardcoded for simplicity
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const PHONE_NUMBER = '+971565401583';

// Make the call
async function makeCall() {
  try {
    console.log(`Making test call to ${PHONE_NUMBER} using VAPI...`);
    
    const payload = {
      type: 'outboundPhoneCall',
      assistant_id: ASSISTANT_ID,
      customer: {
        number: PHONE_NUMBER
      },
      phone_number_id: PHONE_NUMBER_ID
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error making call: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('Call initiated successfully!');
    console.log('Call ID:', data.id);
    console.log('Status:', data.status);
    console.log('Full response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error making call:', error);
  }
}

// Run the function
makeCall();
