/**
 * VAPI Ngrok Setup Script
 *
 * This script sets up ngrok to create a public URL for your local server,
 * then updates the VAPI server URLs to use this public URL.
 *
 * Prerequisites:
 * 1. Install ngrok: npm install -g ngrok
 * 2. Set up ngrok authentication: ngrok authtoken YOUR_AUTH_TOKEN
 *
 * Usage:
 * node setup-ngrok.js
 */

const { exec } = require('child_process');

// Use dynamic import for node-fetch (ESM module)
let fetch;
(async () => {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default;
})();

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8'; // Public key
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';

// Local server port
const PORT = 3004;

// Start ngrok
async function startNgrok() {
  return new Promise((resolve, reject) => {
    console.log(`Starting ngrok on port ${PORT}...`);

    const ngrokProcess = exec(`ngrok http ${PORT}`, (error) => {
      if (error) {
        console.error('Error starting ngrok:', error);
        reject(error);
      }
    });

    // Give ngrok a moment to start
    setTimeout(() => {
      // Get the ngrok URL
      exec('curl -s http://localhost:4040/api/tunnels', (error, stdout) => {
        if (error) {
          console.error('Error getting ngrok URL:', error);
          reject(error);
          return;
        }

        try {
          const tunnels = JSON.parse(stdout).tunnels;
          const httpsUrl = tunnels.find(t => t.proto === 'https').public_url;

          console.log(`Ngrok HTTPS URL: ${httpsUrl}`);
          resolve(httpsUrl);
        } catch (parseError) {
          console.error('Error parsing ngrok response:', parseError);
          reject(parseError);
        }
      });
    }, 2000);
  });
}

// Update VAPI server URLs
async function updateServerUrls(ngrokUrl) {
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
    console.log('Keep this terminal window open to maintain the ngrok tunnel.');
    console.log('Press Ctrl+C to stop ngrok and terminate the tunnel.');

  } catch (error) {
    console.error('Error updating server URLs:', error);
  }
}

// Main function
async function main() {
  try {
    const ngrokUrl = await startNgrok();
    await updateServerUrls(ngrokUrl);
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the script
main();
