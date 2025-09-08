/**
 * Register Webhook with VAPI
 *
 * This script registers the webhook URL with VAPI for receiving call events
 * following the official VAPI documentation.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const WEBHOOK_URL = 'https://252c-91-73-200-83.ngrok-free.app/api/webhooks/vapi';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const WALLET_ID = 'bc24330e-70f5-4508-9370-dbbd56fb3bfa';

// Events to subscribe to
const EVENTS = [
  'call.started',
  'call.ended',
  'call.status_updated',
  'transcript.created',
  'recording.created',
  'summary.created',
  'analysis.created'
];

/**
 * Register webhook with VAPI
 */
async function registerWebhook() {
  try {
    console.log(`Registering webhook URL: ${WEBHOOK_URL}`);
    console.log(`Events: ${EVENTS.join(', ')}`);

    const response = await fetch(`${VAPI_API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: EVENTS,
        active: true,
        description: 'Top Loader Agent AI Solutions webhook for call events'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error registering webhook: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('Webhook registered successfully!');
    console.log('Webhook ID:', data.id);
    console.log('Full response:', JSON.stringify(data, null, 2));

    // List all registered webhooks
    await listWebhooks();
  } catch (error) {
    console.error('Error registering webhook:', error);
  }
}

/**
 * List all registered webhooks
 */
async function listWebhooks() {
  try {
    console.log('\nListing all registered webhooks:');

    const response = await fetch(`${VAPI_API_URL}/webhooks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error listing webhooks: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log(`Found ${data.length} webhooks:`);

    data.forEach((webhook, index) => {
      console.log(`\nWebhook #${index + 1}:`);
      console.log(`ID: ${webhook.id}`);
      console.log(`URL: ${webhook.url}`);
      console.log(`Active: ${webhook.active}`);
      console.log(`Events: ${webhook.events.join(', ')}`);
    });
  } catch (error) {
    console.error('Error listing webhooks:', error);
  }
}

/**
 * Set server URL at the organization level
 */
async function setOrganizationServerUrl() {
  try {
    console.log('\nSetting organization-level server URL...');
    console.log(`Organization ID: ${ORGANIZATION_ID}`);

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
      console.error(`Error setting organization server URL: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('Organization server URL set successfully!');
    console.log('Organization ID:', data.id);
  } catch (error) {
    console.error('Error setting organization server URL:', error);
  }
}

/**
 * Update assistant with server URL
 */
async function updateAssistantServerUrl() {
  try {
    const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
    console.log(`\nUpdating assistant ${ASSISTANT_ID} with server URL...`);

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
      return;
    }

    const data = await response.json();
    console.log('Assistant server URL updated successfully!');
    console.log('Assistant ID:', data.id);
  } catch (error) {
    console.error('Error updating assistant server URL:', error);
  }
}

/**
 * Update phone number with server URL
 */
async function updatePhoneNumberServerUrl() {
  try {
    const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
    console.log(`\nUpdating phone number ${PHONE_NUMBER_ID} with server URL...`);

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
      return;
    }

    const data = await response.json();
    console.log('Phone number server URL updated successfully!');
    console.log('Phone Number ID:', data.id);
  } catch (error) {
    console.error('Error updating phone number server URL:', error);
  }
}

// Run all registration methods
async function registerAll() {
  // Register webhook
  await registerWebhook();

  // Set server URL at all levels
  await setOrganizationServerUrl();
  await updateAssistantServerUrl();
  await updatePhoneNumberServerUrl();

  console.log('\nAll webhook registration methods completed!');
}

// Run the script
registerAll();
