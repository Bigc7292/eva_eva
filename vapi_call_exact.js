/**
 * VAPI Call Script - Using Exact Format
 */

// VAPI configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER = '+971565401583'; // Your phone number

// Make the call
async function makeCall() {
  try {
    console.log(`Making call to ${PHONE_NUMBER}...`);
    
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
        to: PHONE_NUMBER
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('Call initiated successfully!');
    console.log('Call ID:', data.id);
    console.log('Status:', data.status);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
makeCall();
