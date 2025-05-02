/**
 * Update VAPI Webhook URLs
 * 
 * This script updates the webhook URLs for VAPI assistant and phone number
 * to use the current ngrok URL.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private key for admin operations
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = '53cb46fd-5e37-4860-8668-7594005f872a'; // Updated phone number ID from logs

// Set the current ngrok URL
const NGROK_URL = 'https://03d5-80-227-84-38.ngrok-free.app';
const WEBHOOK_URL = `${NGROK_URL}/api/webhooks/vapi`;

console.log('Starting webhook update...');
console.log('Using ngrok URL:', NGROK_URL);
console.log('Setting webhook URL to:', WEBHOOK_URL);

/**
 * Update assistant server URL
 */
async function updateAssistantServerUrl() {
  try {
    console.log(`Updating assistant server URL to: ${WEBHOOK_URL}`);
    
    const response = await fetch(`${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: WEBHOOK_URL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating assistant server URL: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('Assistant server URL updated successfully!');
    console.log('Response:', data);
    return true;
  } catch (error) {
    console.error('Error updating assistant server URL:', error);
    return false;
  }
}

/**
 * Update phone number server URL
 */
async function updatePhoneNumberServerUrl() {
  try {
    console.log(`Updating phone number server URL to: ${WEBHOOK_URL}`);
    
    const response = await fetch(`${VAPI_API_URL}/phone-number/${PHONE_NUMBER_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: WEBHOOK_URL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating phone number server URL: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('Phone number server URL updated successfully!');
    console.log('Response:', data);
    return true;
  } catch (error) {
    console.error('Error updating phone number server URL:', error);
    return false;
  }
}

/**
 * Update all webhook URLs
 */
async function updateAllWebhookUrls() {
  console.log('Updating all webhook URLs in VAPI...');
  
  const assistantResult = await updateAssistantServerUrl();
  const phoneResult = await updatePhoneNumberServerUrl();
  
  if (assistantResult && phoneResult) {
    console.log('\nAll webhook URLs updated successfully!');
  } else {
    console.log('\nSome webhook URLs could not be updated. Please check the errors above.');
  }
}

// Run the script
updateAllWebhookUrls();
