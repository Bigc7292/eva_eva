import fetch from 'node-fetch';

const RETELL_API_KEY = process.env.NEXT_PUBLIC_RETELL_API_KEY;
const WEBHOOK_URL = 'https://d4c0-91-73-203-158.ngrok-free.app/api/webhooks/retell';

async function registerWebhook() {
  try {
    const response = await fetch('https://api.retellai.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
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
      }),
    });

    const data = await response.json();
    console.log('Webhook registration response:', data);
  } catch (error) {
    console.error('Error registering webhook:', error);
  }
}

registerWebhook(); 