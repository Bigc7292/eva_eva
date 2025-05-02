/**
 * Check and Update VAPI Webhook URLs
 * 
 * This script checks if the current ngrok URL is valid and updates the VAPI webhook URLs if needed.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { exec } = require('child_process');

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private key for admin operations
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = '53cb46fd-5e37-4860-8668-7594005f872a'; // Updated phone number ID from logs

// Local server port
const PORT = 3004;

/**
 * Get the current ngrok URL
 */
async function getCurrentNgrokUrl() {
  return new Promise((resolve, reject) => {
    exec('curl -s http://localhost:4040/api/tunnels', (error, stdout) => {
      if (error) {
        console.error('Error getting ngrok URL:', error);
        resolve(null);
        return;
      }

      try {
        const tunnels = JSON.parse(stdout).tunnels;
        if (!tunnels || tunnels.length === 0) {
          console.log('No active ngrok tunnels found');
          resolve(null);
          return;
        }

        const httpsTunnel = tunnels.find(t => t.proto === 'https');
        if (!httpsTunnel) {
          console.log('No HTTPS ngrok tunnel found');
          resolve(null);
          return;
        }

        console.log(`Current ngrok URL: ${httpsTunnel.public_url}`);
        resolve(httpsTunnel.public_url);
      } catch (parseError) {
        console.error('Error parsing ngrok response:', parseError);
        resolve(null);
      }
    });
  });
}

/**
 * Update assistant server URL
 */
async function updateAssistantServerUrl(webhookUrl) {
  try {
    console.log(`Updating assistant server URL to: ${webhookUrl}`);
    
    const response = await fetch(`${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: webhookUrl
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating assistant server URL: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('Assistant server URL updated successfully!');
    return true;
  } catch (error) {
    console.error('Error updating assistant server URL:', error);
    return false;
  }
}

/**
 * Update phone number server URL
 */
async function updatePhoneNumberServerUrl(webhookUrl) {
  try {
    console.log(`Updating phone number server URL to: ${webhookUrl}`);
    
    const response = await fetch(`${VAPI_API_URL}/phone-number/${PHONE_NUMBER_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: webhookUrl
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating phone number server URL: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('Phone number server URL updated successfully!');
    return true;
  } catch (error) {
    console.error('Error updating phone number server URL:', error);
    return false;
  }
}

/**
 * Start ngrok if not running
 */
async function startNgrok() {
  return new Promise((resolve) => {
    console.log(`Starting ngrok on port ${PORT}...`);
    
    const ngrokProcess = exec(`ngrok http ${PORT}`, (error) => {
      if (error) {
        console.error('Error starting ngrok:', error);
        resolve(null);
      }
    });
    
    // Give ngrok a moment to start
    setTimeout(async () => {
      const ngrokUrl = await getCurrentNgrokUrl();
      resolve(ngrokUrl);
    }, 5000);
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Checking ngrok status...');
  
  // Check if ngrok is running
  let ngrokUrl = await getCurrentNgrokUrl();
  
  // If ngrok is not running, start it
  if (!ngrokUrl) {
    console.log('ngrok is not running. Starting ngrok...');
    ngrokUrl = await startNgrok();
    
    if (!ngrokUrl) {
      console.error('Failed to start ngrok. Please start it manually.');
      return;
    }
  }
  
  // Update VAPI webhook URLs
  const webhookUrl = `${ngrokUrl}/api/webhooks/vapi`;
  console.log(`Using webhook URL: ${webhookUrl}`);
  
  const assistantResult = await updateAssistantServerUrl(webhookUrl);
  const phoneResult = await updatePhoneNumberServerUrl(webhookUrl);
  
  if (assistantResult && phoneResult) {
    console.log('\nAll webhook URLs updated successfully!');
  } else {
    console.log('\nSome webhook URLs could not be updated. Please check the errors above.');
  }
}

// Run the script
main();
