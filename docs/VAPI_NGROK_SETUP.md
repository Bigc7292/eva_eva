# Setting Up VAPI with ngrok

This guide provides step-by-step instructions for setting up VAPI with ngrok for local development.

## Prerequisites

- Node.js installed
- ngrok installed (`npm install -g ngrok`)
- ngrok account (free tier is sufficient)

## Step 1: Authenticate ngrok

If you haven't already, authenticate ngrok with your auth token:

```bash
ngrok authtoken YOUR_AUTH_TOKEN
```

You can find your auth token at [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) after signing up.

## Step 2: Start ngrok

Run ngrok to create a tunnel to your local server:

```bash
ngrok http 3004
```

This will display a URL like `https://xxxx-xxxx-xxxx.ngrok.io` that forwards to your local server.

## Step 3: Update VAPI Server URLs Manually

1. **Assistant Server URL**:
   - Go to [VAPI Dashboard](https://dashboard.vapi.ai/assistants)
   - Select your assistant (ID: 209f26bc-b626-43c7-8815-779eff9712bb)
   - Go to the "Advanced" tab
   - Set the server URL to `https://xxxx-xxxx-xxxx.ngrok.io/api/webhooks/vapi`
   - Save changes

2. **Phone Number Server URL**:
   - Go to [VAPI Dashboard](https://dashboard.vapi.ai/phone-numbers)
   - Select your phone number (ID: e65a9e6b-33b7-4711-ad21-90220048e38f)
   - Set the server URL to `https://xxxx-xxxx-xxxx.ngrok.io/api/webhooks/vapi`
   - Save changes

## Step 4: Test the Integration

Make a test call using the VAPI API:

```bash
npx ts-node vapi_test.ts
```

## Step 5: Start Your Application

Start your Next.js application:

```bash
npm run dev -- -p 3004
```

## Troubleshooting

- **ngrok not found**: Make sure ngrok is installed globally (`npm install -g ngrok`)
- **Authentication error**: Make sure you've authenticated ngrok with your auth token
- **Webhook events not received**: Make sure your application is running on port 3004
- **Call not initiated**: Check the VAPI API response for any errors

## Important Notes

- Keep the ngrok terminal window open while testing
- The ngrok URL changes each time you restart ngrok (unless you have a paid plan)
- You'll need to update the VAPI server URLs each time the ngrok URL changes
