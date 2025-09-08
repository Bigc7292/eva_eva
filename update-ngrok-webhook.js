/**
 * Update VAPI webhook URL with ngrok URL
 *
 * This script updates the VAPI webhook URL with the current ngrok URL.
 * Run this after starting ngrok with `npm run vapi:ngrok`.
 *
 * Usage:
 * 1. Start ngrok: npm run vapi:ngrok
 * 2. In a new terminal, get the ngrok URL from the ngrok interface
 * 3. Run this script: node update-ngrok-webhook.js https://your-ngrok-url.ngrok.io
 */

// Use dynamic import for node-fetch (ESM module)
let fetch;
(async () => {
  console.log('Starting webhook update...');
  console.log('Ngrok URL:', ngrokUrl);
  try {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
    await updateServerUrls();
    console.log('Webhook update completed.');
  } catch (error) {
    console.error('Error in main process:', error);
  }
})();

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private key for admin operations
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';

// Get the ngrok URL from command line arguments
const ngrokUrl = process.argv[2];

if (!ngrokUrl) {
  console.error('Please provide the ngrok URL as a command line argument');
  console.error('Usage: node update-ngrok-webhook.js https://your-ngrok-url.ngrok.io');
  process.exit(1);
}

// Update VAPI server URLs
async function updateServerUrls() {
  console.log('Updating server URLs...');
  const webhookUrl = `${ngrokUrl}/api/webhooks/vapi`;
  console.log(`Setting VAPI webhook URL to: ${webhookUrl}`);

  try {
    // Update assistant server URL
    console.log('Updating assistant server URL...');
    const assistantResponse = await fetch(`${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: webhookUrl
      })
    });

    if (!assistantResponse.ok) {
      console.error(`Failed to update assistant server URL: ${assistantResponse.status}`);
      const errorText = await assistantResponse.text();
      console.error(`Error details: ${errorText}`);
    } else {
      console.log('✅ Assistant server URL updated successfully');
    }

    // Update phone number server URL
    console.log('Updating phone number server URL...');
    const phoneResponse = await fetch(`${VAPI_API_URL}/phone-number/${PHONE_NUMBER_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: webhookUrl
      })
    });

    if (!phoneResponse.ok) {
      console.error(`Failed to update phone number server URL: ${phoneResponse.status}`);
      const errorText = await phoneResponse.text();
      console.error(`Error details: ${errorText}`);
    } else {
      console.log('✅ Phone number server URL updated successfully');
    }

    console.log('\n=== VAPI Webhook Setup Complete ===');
    console.log(`Your webhook URL is: ${webhookUrl}`);
    console.log('You can now make test calls with:');
    console.log('  node vapi_direct_test.js');

  } catch (error) {
    console.error('Error updating server URLs:', error);
  }
}

// Script is run via the async IIFE above
