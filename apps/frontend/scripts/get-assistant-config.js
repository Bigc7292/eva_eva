// Script to get Vapi assistant configuration
const https = require('https');

const VAPI_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';

const options = {
  hostname: 'api.vapi.ai',
  path: `/assistant/${VAPI_ASSISTANT_ID}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json'
  }
};

console.log(`Getting configuration for assistant ${VAPI_ASSISTANT_ID}`);

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Assistant configuration:');
      try {
        const parsedData = JSON.parse(responseData);
        console.log(JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.log(responseData);
      }
    } else {
      console.error(`Error getting assistant configuration: ${res.statusCode}`);
      console.error(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error getting assistant configuration:', error);
});

req.end();
