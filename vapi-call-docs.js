/**
 * VAPI Call - Following Documentation Format
 * 
 * This script follows the exact format from the VAPI documentation
 * for making outbound calls.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';

// Make a call using the exact format from the VAPI documentation
async function makeCall() {
  console.log('=== VAPI Call (Documentation Format) ===');
  console.log(`Making call to: ${YOUR_PHONE_NUMBER}`);
  console.log(`Using assistant ID: ${ASSISTANT_ID}`);
  
  try {
    // Create the request payload exactly as shown in the documentation
    const payload = {
      assistant_id: ASSISTANT_ID,
      to: YOUR_PHONE_NUMBER,
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
