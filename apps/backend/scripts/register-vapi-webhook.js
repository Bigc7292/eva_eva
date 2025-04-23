const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../frontend/.env.local') });

const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b'; // Private API key
const WEBHOOK_URL = 'https://ee20-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

async function updateAssistantServerUrl() {
  try {
    console.log('Updating assistant server URL...');
    console.log('Assistant ID:', VAPI_ASSISTANT_ID);
    console.log('Server URL:', WEBHOOK_URL);

    if (!VAPI_API_KEY) {
      console.error('Vapi API key is missing. Please set NEXT_PUBLIC_VAPI_API_KEY in your .env.local file.');
      return false;
    }

    if (!VAPI_ASSISTANT_ID) {
      console.error('Vapi assistant ID is missing. Please set NEXT_PUBLIC_VAPI_ASSISTANT_ID in your .env.local file.');
      return false;
    }

    const response = await fetch(`https://api.vapi.ai/assistant/${VAPI_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serverUrl: WEBHOOK_URL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error updating assistant server URL:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return false;
    }

    const data = await response.json();
    console.log('Assistant server URL updated successfully!');
    console.log('Assistant ID:', data.id);
    return true;
  } catch (error) {
    console.error('Error updating assistant server URL:', error);
    return false;
  }
}

// Set the correct assistant ID
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';

// Update the assistant server URL
updateAssistantServerUrl();
