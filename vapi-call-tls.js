/**
 * VAPI Call with TLS Configuration
 */

// Set TLS version explicitly
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // This is not recommended for production, but helps diagnose TLS issues

// Import https for direct HTTPS requests
const https = require('https');

// VAPI Configuration
const VAPI_API_URL = 'api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';

// Make a call using direct HTTPS request
function makeCall() {
  console.log('Starting call...');
  
  const payload = JSON.stringify({
    type: 'outboundPhoneCall',
    assistantId: VAPI_ASSISTANT_ID,
    phoneNumberId: PHONE_NUMBER_ID,
    customer: {
      number: YOUR_PHONE_NUMBER
    },
    name: `TestCall_${Date.now()}`
  });
  
  console.log('Request payload:', payload);
  
  const options = {
    hostname: VAPI_API_URL,
    port: 443,
    path: '/call',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${PRIVATE_API_KEY}`
    },
    // Force TLS 1.2 (or try 1.3)
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3'
  };
  
  const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      
      try {
        const responseData = JSON.parse(data);
        console.log('Call initiated successfully!');
        console.log('Call ID:', responseData.id);
        console.log('Status:', responseData.status);
        
        // Check status after 10 seconds
        setTimeout(() => {
          checkStatus(responseData.id);
        }, 10000);
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error making call:', error);
  });
  
  // Write data to request body
  req.write(payload);
  req.end();
}

// Check call status
function checkStatus(callId) {
  console.log(`Checking status for call ${callId}...`);
  
  const options = {
    hostname: VAPI_API_URL,
    port: 443,
    path: `/call/${callId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRIVATE_API_KEY}`
    },
    // Force TLS 1.2 (or try 1.3)
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3'
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const responseData = JSON.parse(data);
        console.log('Current status:', responseData.status);
        console.log('Full data:', JSON.stringify(responseData, null, 2));
      } catch (error) {
        console.error('Error parsing status response:', error);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error checking status:', error);
  });
  
  req.end();
}

// Run the function
console.log('Script started');
makeCall();
