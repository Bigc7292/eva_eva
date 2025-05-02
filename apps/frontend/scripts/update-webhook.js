// Script to update Vapi webhook URL
const https = require('https');

const VAPI_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const NGROK_URL = 'https://0a65-80-227-84-38.ngrok-free.app';

const data = JSON.stringify({
  webhook_url: `${NGROK_URL}/api/webhooks/vapi`
});

const options = {
  hostname: 'api.vapi.ai',
  path: `/assistant/${VAPI_ASSISTANT_ID}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log(`Updating webhook URL for assistant ${VAPI_ASSISTANT_ID} to ${NGROK_URL}/api/webhooks/vapi`);

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Webhook URL updated successfully:');
      try {
        const parsedData = JSON.parse(responseData);
        console.log(JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.log(responseData);
      }
    } else {
      console.error(`Error updating webhook URL: ${res.statusCode}`);
      console.error(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error updating webhook URL:', error);
});

req.write(data);
req.end();
