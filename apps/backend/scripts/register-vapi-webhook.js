import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../frontend/.env.local') });

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;
const WEBHOOK_URL = 'https://53d8-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

async function registerVapiWebhook() {
  try {
    console.log('Registering Vapi webhook with URL:', WEBHOOK_URL);
    console.log('Using Vapi API Key:', VAPI_API_KEY ? 'API Key found' : 'API Key missing');

    if (!VAPI_API_KEY) {
      console.error('Vapi API key is missing. Please set NEXT_PUBLIC_VAPI_API_KEY in your .env.local file.');
      return;
    }

    // Register the webhook
    const response = await fetch('https://api.vapi.ai/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: [
          'call.started',
          'call.ended',
          'call.status_updated',
          'call.transcript_updated',
          'call.analysis_updated'
        ],
        active: true,
        description: 'Real Estate CRM webhook for Vapi call events'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from Vapi:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return;
    }

    const data = await response.json();
    console.log('Vapi webhook registration successful:', data);

    // Verify the webhook is registered
    const verifyResponse = await fetch('https://api.vapi.ai/webhooks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const webhooks = await verifyResponse.json();
    console.log('Current Vapi webhooks:', webhooks);

  } catch (error) {
    console.error('Error registering Vapi webhook:', error);
  }
}

registerVapiWebhook();
