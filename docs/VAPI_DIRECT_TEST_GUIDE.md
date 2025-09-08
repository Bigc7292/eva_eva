# VAPI Direct Testing Guide

This guide explains how to test VAPI integration directly without requiring ngrok or other tools.

## Prerequisites

- Node.js installed
- Internet connection to access VAPI API

## Step 1: Update Server URLs in VAPI Dashboard

Before testing, make sure your VAPI server URLs are properly configured:

1. Go to [VAPI Dashboard](https://dashboard.vapi.ai/assistants)
2. Select your assistant (ID: 209f26bc-b626-43c7-8815-779eff9712bb)
3. Go to the "Advanced" tab
4. Set the server URL to a webhook testing service like webhook.site
   (See the [Webhook.site Guide](./VAPI_WEBHOOK_SITE_GUIDE.md) for details)
5. Save changes

Also update the phone number:
1. Go to [VAPI Dashboard](https://dashboard.vapi.ai/phone-numbers)
2. Select your phone number (ID: e65a9e6b-33b7-4711-ad21-90220048e38f)
3. Set the server URL to the same webhook testing service
4. Save changes

## Step 2: Run the Direct Test Script

Run the direct test script to make a call using VAPI:

```bash
npm run vapi:direct
```

This script:
1. Makes a direct API call to VAPI to initiate a call
2. Waits 10 seconds
3. Checks the call status
4. Displays the results

## Step 3: Check the Results

The script will output:
- Call initiation status
- Call ID
- Call status after 10 seconds
- Full call data

If the call is initiated successfully, you should see:
```
✅ Call initiated successfully!
Call ID: call-xxxx-xxxx-xxxx
Initial status: queued
```

## Step 4: Check Webhook Events

If you configured a webhook testing service like webhook.site:
1. Go to your webhook.site page
2. You should see incoming webhook events from VAPI
3. These events show what your application would receive

## Troubleshooting

If the call fails to initiate, check:

1. **API Keys**: Verify your VAPI API keys are correct
2. **Assistant ID**: Make sure the assistant ID is correct and the assistant is published
3. **Phone Number**: Verify the phone number ID is correct and the phone number is active
4. **Network**: Ensure you have internet connectivity to access the VAPI API

## Next Steps

Once you've verified that VAPI calls are working:

1. Set up a proper webhook handler in your application
2. Configure your application to process webhook events
3. Implement call status tracking and recording playback
