/**
 * Update VAPI webhook URL directly using the VAPI API
 */

const https = require('https');

// VAPI Configuration
const VAPI_API_URL = 'api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private key for admin operations
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';

// Set the ngrok URL
const ngrokUrl = 'https://03d5-80-227-84-38.ngrok-free.app';
const webhookUrl = `${ngrokUrl}/api/webhooks/vapi`;

console.log('Starting webhook update...');
console.log('Using ngrok URL:', ngrokUrl);
console.log('Setting webhook URL to:', webhookUrl);

// Update assistant webhook URL
function updateAssistantWebhook() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      webhook_url: webhookUrl
    });

    const options = {
      hostname: VAPI_API_URL,
      port: 443,
      path: `/v1/assistants/${VAPI_ASSISTANT_ID}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Assistant webhook URL updated successfully');
          try {
            const parsedData = JSON.parse(responseData);
            console.log('Response:', parsedData);
            resolve(parsedData);
          } catch (e) {
            console.log('Response (raw):', responseData);
            resolve(responseData);
          }
        } else {
          console.error(`Failed to update assistant webhook URL: ${res.statusCode}`);
          console.error(`Error details: ${responseData}`);
          reject(new Error(`HTTP Error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error updating assistant webhook URL:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Update phone number webhook URL
function updatePhoneNumberWebhook() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      webhook_url: webhookUrl
    });

    const options = {
      hostname: VAPI_API_URL,
      port: 443,
      path: `/v1/phone_numbers/${PHONE_NUMBER_ID}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Phone number webhook URL updated successfully');
          try {
            const parsedData = JSON.parse(responseData);
            console.log('Response:', parsedData);
            resolve(parsedData);
          } catch (e) {
            console.log('Response (raw):', responseData);
            resolve(responseData);
          }
        } else {
          console.error(`Failed to update phone number webhook URL: ${res.statusCode}`);
          console.error(`Error details: ${responseData}`);
          reject(new Error(`HTTP Error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error updating phone number webhook URL:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Run the updates
async function main() {
  try {
    console.log('Updating assistant webhook URL...');
    await updateAssistantWebhook();
    
    console.log('Updating phone number webhook URL...');
    await updatePhoneNumberWebhook();
    
    console.log('\n=== VAPI Webhook Setup Complete ===');
    console.log(`Your webhook URL is: ${webhookUrl}`);
  } catch (error) {
    console.error('Error updating webhook URLs:', error);
  }
}

main();
