# Using webhook.site for VAPI Testing

This guide explains how to use webhook.site as a temporary solution for testing VAPI webhooks when you can't use ngrok.

## What is webhook.site?

[Webhook.site](https://webhook.site) is a free service that provides you with a unique URL to collect, inspect and debug webhook calls. It's perfect for testing webhook integrations without setting up a public server.

## Step 1: Get a Unique Webhook URL

1. Go to [webhook.site](https://webhook.site)
2. You'll automatically be assigned a unique URL like `https://webhook.site/your-unique-id`
3. Keep this page open to see incoming webhook requests

## Step 2: Update VAPI Server URLs

### Option A: Using the VAPI Dashboard

1. Go to [VAPI Dashboard](https://dashboard.vapi.ai/assistants)
2. Select your assistant (ID: 209f26bc-b626-43c7-8815-779eff9712bb)
3. Go to the "Advanced" tab
4. Set the server URL to your webhook.site URL
5. Save changes

Also update the phone number:
1. Go to [VAPI Dashboard](https://dashboard.vapi.ai/phone-numbers)
2. Select your phone number (ID: e65a9e6b-33b7-4711-ad21-90220048e38f)
3. Set the server URL to your webhook.site URL
4. Save changes

### Option B: Using the debug script

1. Edit the `vapi_debug.ts` file
2. Update the `SERVER_URL` constant with your webhook.site URL:
   ```typescript
   const SERVER_URL = 'https://webhook.site/your-unique-id';
   ```
3. Run the debug script:
   ```bash
   npm run vapi:debug
   ```

## Step 3: Test the Integration

Make a test call using the VAPI API:

```bash
npm run vapi:test
```

## Step 4: Inspect Webhook Calls

1. Go back to the webhook.site page
2. You should see incoming webhook requests from VAPI
3. Inspect the request bodies to understand the webhook data structure

## Limitations

Using webhook.site has some limitations:

1. **One-way communication**: You can receive webhook events, but you can't respond to them
2. **No processing**: The webhook events won't be processed by your application
3. **Temporary**: The URL is temporary and will expire after some time

## Next Steps

Once you've verified that VAPI is sending webhook events correctly, you should:

1. Set up a proper public URL for your application
2. Update the VAPI server URLs to use your public URL
3. Implement proper webhook handling in your application

## Alternative Services

If webhook.site is not accessible, you can try these alternatives:

- [Pipedream](https://pipedream.com/)
- [RequestBin](https://requestbin.com/)
- [Beeceptor](https://beeceptor.com/)
