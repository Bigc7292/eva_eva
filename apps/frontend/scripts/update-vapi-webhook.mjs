/**
 * Script to update the Vapi webhook URL
 * 
 * This script updates the webhook URL for a Vapi assistant
 * to point to our ngrok URL for real-time call monitoring.
 */

import fetch from 'node-fetch';

const VAPI_API_KEY = 'e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8'; // Your Vapi API key
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738'; // Your Vapi assistant ID
const NGROK_URL = 'https://0a65-80-227-84-38.ngrok-free.app'; // Your ngrok URL

async function updateWebhookUrl() {
  try {
    console.log(`Updating webhook URL for assistant ${VAPI_ASSISTANT_ID} to ${NGROK_URL}/api/webhooks/vapi`);
    
    const response = await fetch(`https://api.vapi.ai/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhook_url: `${NGROK_URL}/api/webhooks/vapi`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update webhook URL: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Webhook URL updated successfully:', data);
    
    // Verify the update
    const verifyResponse = await fetch(`https://api.vapi.ai/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`
      }
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      throw new Error(`Failed to verify webhook URL: ${verifyResponse.status} - ${errorText}`);
    }

    const verifyData = await verifyResponse.json();
    console.log('Current assistant configuration:', verifyData);
    console.log(`Webhook URL is now set to: ${verifyData.webhook_url}`);
  } catch (error) {
    console.error('Error updating webhook URL:', error);
  }
}

// Run the function
updateWebhookUrl();
