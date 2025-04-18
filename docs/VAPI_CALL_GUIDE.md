# VAPI Call Guide

This guide explains how to make calls using the VAPI API.

## API Keys

VAPI uses two types of API keys:

1. **Public API Key**: Used for read-only operations and some public endpoints
2. **Private API Key**: Used for making calls and other write operations

For making calls, you must use the **Private API Key**.

## Making a Call

To make a call using VAPI, use the following format:

```javascript
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const VAPI_ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';

// Make a call
async function makeCall() {
  const response = await fetch(`${VAPI_API_URL}/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PRIVATE_API_KEY}`
    },
    body: JSON.stringify({
      type: 'outboundPhoneCall',
      assistantId: VAPI_ASSISTANT_ID,
      phoneNumberId: PHONE_NUMBER_ID,
      customer: {
        number: YOUR_PHONE_NUMBER
      },
      name: `TestCall_${Date.now()}`
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Call initiation failed:', data);
    return null;
  }

  console.log('Call initiated successfully!');
  console.log('Call ID:', data.id);
  console.log('Initial status:', data.status);
  return data.id;
}
```

## Checking Call Status

To check the status of a call:

```javascript
async function checkCallStatus(callId) {
  const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRIVATE_API_KEY}`
    }
  });

  if (!response.ok) {
    console.error(`Failed to get call status: ${response.status} ${response.statusText}`);
    return;
  }

  const data = await response.json();
  console.log('Call status:', data.status);
  console.log('Full call data:', JSON.stringify(data, null, 2));
}
```

## Webhook Configuration

To receive call events, configure a webhook URL in the VAPI dashboard or using the API:

```javascript
// Update assistant server URL
async function updateAssistantServerUrl(webhookUrl) {
  const response = await fetch(`${VAPI_API_URL}/assistant/${VAPI_ASSISTANT_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PRIVATE_API_KEY}`
    },
    body: JSON.stringify({
      serverUrl: webhookUrl
    })
  });

  if (!response.ok) {
    console.error(`Failed to update assistant server URL: ${response.status} ${response.statusText}`);
    return false;
  }

  console.log('Assistant server URL updated successfully');
  return true;
}
```

## Available Scripts

The following npm scripts are available for testing VAPI integration:

- `npm run vapi:both` - Make a call using both public and private keys (recommended)
- `npm run vapi:webhook` - Update the webhook URL for VAPI
- `npm run vapi:debug` - Run the debug script to check VAPI configuration

## Troubleshooting

If you encounter issues with VAPI integration:

1. **403 Forbidden Error**: Make sure you're using the private API key for making calls
2. **Call Not Initiated**: Verify that the assistant ID and phone number ID are correct
3. **Webhook Events Not Received**: Check that the webhook URL is properly configured

## References

- [VAPI API Documentation](https://docs.vapi.ai/api-reference/calls)
- [VAPI Webhook Events](https://docs.vapi.ai/server-url/events)
