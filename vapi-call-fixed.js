/**
 * VAPI Call - Fixed Implementation
 * 
 * This script follows the exact VAPI documentation format
 * and includes additional authentication parameters.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const ORG_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const YOUR_PHONE_NUMBER = '+971565401583';

// Make a call using the exact VAPI documentation format
async function makeCall() {
  console.log('=== VAPI Call (Fixed Format) ===');
  console.log(`Making call to: ${YOUR_PHONE_NUMBER}`);
  console.log(`Using assistant ID: ${ASSISTANT_ID}`);
  console.log(`Using organization ID: ${ORG_ID}`);
  
  try {
    // Create the request payload exactly as specified in the VAPI documentation
    const payload = {
      // Use 'assistant_id' instead of 'assistantId' (snake_case vs camelCase)
      assistant_id: ASSISTANT_ID,
      // Include the organization ID
      org_id: ORG_ID,
      // Use 'to' instead of nested customer object
      to: YOUR_PHONE_NUMBER,
      // Include phone_number_id in snake_case
      phone_number_id: PHONE_NUMBER_ID,
      // Add a unique name for the call
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
      
      if (response.ok) {
        console.log('✅ Call initiated successfully!');
        console.log('Call ID:', data.id);
        console.log('Status:', data.status);
        
        // Wait for 10 seconds then check call status
        console.log('Waiting 10 seconds to check call status...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check call status
        await checkCallStatus(data.id);
      } else {
        console.error('❌ Call initiation failed:', data);
        
        // Provide specific guidance based on the error
        if (data.message && data.message.includes('Authenticate')) {
          console.error('Authentication error with Twilio. Possible solutions:');
          console.error('1. Check if your VAPI account is properly connected to Twilio');
          console.error('2. Verify that your phone number is correctly configured in VAPI');
          console.error('3. Ensure your VAPI account has sufficient credits');
          console.error('4. Contact VAPI support with your organization ID and this error message');
        }
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
    }
  } catch (error) {
    console.error('❌ Error making call:', error);
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
console.log('Starting VAPI call script...');
makeCall().then(() => {
  console.log('Script completed.');
}).catch(error => {
  console.error('Unhandled error:', error);
});

console.log('Script initiated. Waiting for call to be made...');
