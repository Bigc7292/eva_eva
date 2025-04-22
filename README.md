# Top Loader Agent AI Solutions

A real estate AI calling solution using VAPI for voice calls and Supabase for data storage.

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account
- VAPI account with API keys
- Twilio account with a phone number

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables in `.env.local`:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://stexfwbuwyyfmkmxcftv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# VAPI Configuration
NEXT_PUBLIC_VAPI_API_URL=https://api.vapi.ai
NEXT_PUBLIC_VAPI_ASSISTANT_ID=cfaa163c-4a47-471b-a39e-95c12d0cb738
NEXT_PUBLIC_VAPI_AGENT_ID=cfaa163c-4a47-471b-a39e-95c12d0cb738
NEXT_PUBLIC_VAPI_API_KEY=e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8
NEXT_PRIVATE_VAPI_API_KEY=d1529b85-51d5-47c0-9332-a73d40f7d62b
NEXT_PUBLIC_VAPI_ORG_ID=8ddf2438-8b84-42c2-973c-4b7a69272a99
NEXT_PUBLIC_VAPI_CALLER_ID=+971565401583
NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID=e65a9e6b-33b7-4711-ad21-90220048e38f
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

4. Start the development server:

```bash
npm run dev -- -p 3004
```

## VAPI Integration

### Setting Up VAPI

1. Configure server URLs for webhooks:

```bash
# Run the debug script to check and update server URLs
npx ts-node vapi_debug.ts
```

2. For local development, use ngrok to create a public URL:

```bash
# Install ngrok if you haven't already
npm install -g ngrok

# Run the ngrok setup script
node setup-ngrok.js
```

3. Test the VAPI integration:

```bash
# Run the test script
npx ts-node vapi_test.ts
```

### Webhook Configuration

VAPI requires a server URL to send webhook events to. The webhook URL should be:

- For local development with ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/vapi`
- For production: `https://your-domain.com/api/webhooks/vapi`

The webhook handler is located at `apps/frontend/src/app/api/webhooks/vapi/route.ts`.

## Making Calls

1. Navigate to the single call page: `http://localhost:3004/calls/single`
2. Enter a phone number in the format `+1234567890`
3. Click "Make Call"

## Contact Profiles

Every contact imported into the system automatically gets a profile page. Each profile contains:

- Name
- Phone number
- Email
- Transcripts from all calls
- Summaries from all calls
- MP4 audio files from all calls

All interactions with a contact are logged and accessible from their profile page.

## Troubleshooting

If you encounter issues with VAPI integration, refer to the debugging guide:

```bash
# View the debugging guide
cat docs/VAPI_DEBUGGING_GUIDE.md
```

Common issues:

1. **Call initiated but no actual call received**:
   - Check that server URLs are properly configured
   - Verify that your Twilio number is active
   - Ensure the assistant is published and active

2. **Webhook events not being received**:
   - Check that your server is running on port 3004
   - Verify that ngrok is running and the URL is correctly set in VAPI
   - Check server logs for incoming webhook requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Analysis Checklist

Analyze for:
- Project description present?
- Setup/installation instructions clear and accurate?
- Usage examples provided?
- Contribution guidelines included?
- License and contact info present?
- All links and badges working?
