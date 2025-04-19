/**
 * Update VAPI Webhook URLs
 * 
 * This script updates the webhook URLs in VAPI at the organization, assistant, and phone number levels
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const WEBHOOK_URL = 'https://01e6-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

/**
 * Update organization server URL
 */
async function updateOrganizationServerUrl() {
  try {
    console.log(`Updating organization server URL to: ${WEBHOOK_URL}`);
    
    const response = await fetch(`${VAPI_API_URL}/organization/${ORGANIZATION_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        server: {
          url: WEBHOOK_URL
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating organization server URL: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('Organization server URL updated successfully!');
    return true;
  } catch (error) {
    console.error('Error updating organization server URL:', error);
    return false;
  }
}

/**
 * Update assistant server URL
 */
async function updateAssistantServerUrl() {
  try {
    console.log(`Updating assistant server URL to: ${WEBHOOK_URL}`);
    
    const response = await fetch(`${VAPI_API_URL}/assistant/${ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
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
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
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
  
  const orgResult = await updateOrganizationServerUrl();
  const assistantResult = await updateAssistantServerUrl();
  const phoneResult = await updatePhoneNumberServerUrl();
  
  if (orgResult && assistantResult && phoneResult) {
    console.log('\nAll webhook URLs updated successfully!');
  } else {
    console.log('\nSome webhook URLs could not be updated. Please check the errors above.');
  }
}

// Run the script
updateAllWebhookUrls();
