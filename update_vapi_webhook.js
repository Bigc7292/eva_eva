/**
 * Update VAPI Webhook URLs
 *
 * This script updates the server URLs for VAPI assistant and phone number
 * to use the webhook.site URL.
 *
 * Usage:
 * node update_vapi_webhook.js
 */

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private key for admin operations
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';

// Webhook URL for receiving events
const WEBHOOK_URL = 'https://dfb7-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

// Update assistant server URL
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
      console.error(`Failed to update assistant server URL: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return false;
    }

    console.log('✅ Assistant server URL updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating assistant server URL:', error);
    return false;
  }
}

// Update phone number server URL
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
      console.error(`Failed to update phone number server URL: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return false;
    }

    console.log('✅ Phone number server URL updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating phone number server URL:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Updating VAPI Webhook URLs ===');

  const assistantUpdated = await updateAssistantServerUrl();
  const phoneNumberUpdated = await updatePhoneNumberServerUrl();

  if (assistantUpdated && phoneNumberUpdated) {
    console.log('\n✅ All server URLs updated successfully!');
    console.log(`Webhook URL: ${WEBHOOK_URL}`);
    console.log('\nYou can now:');
    console.log('1. Go to webhook.site to see incoming webhook events');
    console.log('2. Run "node vapi_direct_test.js" to make a test call');
  } else {
    console.log('\n⚠️ Some updates failed. Please check the errors above.');
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
});
