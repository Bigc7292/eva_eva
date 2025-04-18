/**
 * Script to register the VAPI webhook URL
 * 
 * This script registers the webhook URL with VAPI for receiving call events
 * Run this script after starting ngrok to update the webhook URL
 */

// Load environment variables
require('dotenv').config();

const VAPI_API_URL = process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai';
const PRIVATE_VAPI_API_KEY = process.env.NEXT_PRIVATE_VAPI_API_KEY;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_VAPI_WEBHOOK_URL;

if (!PRIVATE_VAPI_API_KEY) {
  console.error('Missing VAPI private API key');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('Missing webhook URL');
  process.exit(1);
}

async function registerWebhook() {
  try {
    console.log(`Registering webhook URL: ${WEBHOOK_URL}`);

    const response = await fetch(`${VAPI_API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_VAPI_API_KEY}`
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: [
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
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register webhook: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Webhook registered successfully:', data);
  } catch (error) {
    console.error('Error registering webhook:', error);
  }
}

registerWebhook();
