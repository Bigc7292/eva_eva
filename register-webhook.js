/**
 * Register Webhook with VAPI
 *
 * This script registers the webhook URL with VAPI for receiving call events
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const WEBHOOK_URL = 'https://01e6-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

// Events to subscribe to
const EVENTS = [
  'call.started',
  'call.ended',
  'call.status_updated',
  'transcript.created',
  'recording.created',
  'summary.created',
  'analysis.created',
  'call.failed',
  'call.ringing',
  'call.answered',
  'call.in_progress'
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

// Run the script
registerWebhook();
