import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const RETELL_API_KEY = process.env.NEXT_PUBLIC_RETELL_API_KEY;
const WEBHOOK_URL = 'https://296f-83-111-119-3.ngrok-free.app/api/webhooks/retell';

async function registerWebhook() {
  try {
    console.log('Registering webhook with URL:', WEBHOOK_URL);
    console.log('Using API Key:', RETELL_API_KEY ? 'API Key found' : 'API Key missing');
    
    // Register the webhook
    const response = await fetch('https://api.retellai.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: [
          'call.started',
          'call.ended',
          'recording.completed',
          'transcription.completed'
        ],
        active: true,
        description: 'Real Estate CRM webhook for call events'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from Retell:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return;
    }

    const data = await response.json();
    console.log('Webhook registration successful:', data);

    // Verify the webhook is registered
    const verifyResponse = await fetch('https://api.retellai.com/v1/webhooks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const webhooks = await verifyResponse.json();
    console.log('Current webhooks:', webhooks);

  } catch (error) {
    console.error('Error registering webhook:', error);
  }
}

registerWebhook(); 