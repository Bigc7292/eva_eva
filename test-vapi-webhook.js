/**
 * Test VAPI Webhook
 *
 * This script sends test webhook events to the webhook monitor
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
// Local webhook URL
const LOCAL_WEBHOOK_URL = 'http://localhost:3004/api/webhooks/vapi';
// Ngrok webhook URL
const NGROK_WEBHOOK_URL = 'https://252c-91-73-200-83.ngrok-free.app/api/webhooks/vapi';
// Use the ngrok URL for testing
const WEBHOOK_URL = NGROK_WEBHOOK_URL;
const CALL_ID = `test-call-${Date.now()}`;

// Test data - simulates VAPI webhook events
const testEvents = [
  // Legacy format events
  {
    name: 'call.started',
    payload: {
      event: 'call.started',
      call_id: CALL_ID,
      data: {
        to: '+971565401583',
        from: '+19143713101',
        direction: 'outbound',
        status: 'started'
      }
    }
  },
  {
    name: 'call.status_updated',
    payload: {
      event: 'call.status_updated',
      call_id: CALL_ID,
      data: {
        status: 'ringing'
      }
    }
  },
  {
    name: 'call.status_updated (answered)',
    payload: {
      event: 'call.status_updated',
      call_id: CALL_ID,
      data: {
        status: 'in-progress'
      }
    }
  },
  {
    name: 'transcript.created',
    payload: {
      event: 'transcript.created',
      call_id: CALL_ID,
      data: {
        transcript: 'Hello, this is a test transcript. I am calling from Top Loader Agent AI Solutions to discuss your real estate needs.'
      }
    }
  },
  {
    name: 'call.ended',
    payload: {
      event: 'call.ended',
      call_id: CALL_ID,
      data: {
        duration: 120,
        status: 'completed',
        recording_url: `https://example.com/recordings/${CALL_ID}.mp3`
      }
    }
  },

  // New format events (2025)
  {
    name: 'status-update',
    payload: {
      message: {
        type: 'status-update',
        call: {
          id: CALL_ID,
          status: 'in-progress',
          duration: 45
        }
      }
    }
  },
  {
    name: 'end-of-call-report',
    payload: {
      message: {
        type: 'end-of-call-report',
        call: {
          id: CALL_ID,
          status: 'completed',
          duration: 120
        },
        transcript: 'Hello, this is a test transcript from the new format. I am calling from Top Loader Agent AI Solutions to discuss your real estate needs.',
        summary: 'Customer expressed interest in luxury properties in Dubai Marina area with a budget of 2-3 million AED. They requested a meeting next week to discuss options.',
        structuredData: {
          meetingBooked: true,
          meetingTime: '2025-04-25T14:00:00Z',
          propertyInterest: 'Luxury Apartment',
          budget: '2500000',
          location: 'Dubai Marina',
          name: 'John Smith',
          email: 'john.smith@example.com'
        }
      }
    }
  }
];

// Function to send a test webhook event
async function sendTestEvent(event) {
  try {
    console.log(`Sending test event: ${event.name}`);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event.payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Response for ${event.name}:`, data);
    console.log('-----------------------------------');

    // Wait 2 seconds before sending the next event
    return new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`Error sending ${event.name}:`, error);
  }
}

// Send all test events in sequence
async function sendAllEvents() {
  console.log('Starting test webhook events...');

  for (const event of testEvents) {
    await sendTestEvent(event);
  }

  console.log('All test events sent!');
}

// Run the script
sendAllEvents();
