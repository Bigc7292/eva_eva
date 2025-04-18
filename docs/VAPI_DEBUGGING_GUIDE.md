# VAPI Debugging Guide

This guide provides steps to debug and troubleshoot VAPI integration issues.

## Browser Developer Tools

The "browser developer tools" are built-in debugging tools in your web browser that help you inspect network requests, view console logs, and debug JavaScript errors.

### How to Open Developer Tools

- **Chrome**: Press F12 or right-click on the page and select "Inspect"
- **Firefox**: Press F12 or right-click on the page and select "Inspect Element"
- **Edge**: Press F12 or right-click on the page and select "Inspect"

### Using Developer Tools for VAPI Debugging

1. **Console Tab**: Shows JavaScript logs and errors
   - Look for any error messages related to VAPI API calls
   - Check for successful call initiation messages

2. **Network Tab**: Shows all HTTP requests
   - Filter by "fetch/XHR" to see API calls
   - Look for calls to `api.vapi.ai`
   - Check the request payload and response

## Common VAPI Issues and Solutions

### Call Initiated but No Actual Call Received

1. **Check Twilio Configuration**:
   - Verify that your Twilio number is properly configured in the VAPI dashboard
   - Ensure the Twilio number has the correct webhook configuration
   - Confirm that the phone number ID (`e65a9e6b-33b7-4711-ad21-90220048e38f`) is correctly set up

2. **Check VAPI Assistant Configuration**:
   - Verify the assistant ID is correct (`209f26bc-b626-43c7-8815-779eff9712bb`)
   - Make sure the assistant is published and active
   - Check that the assistant has the necessary permissions to make calls

3. **Check API Keys**:
   - Ensure you're using the correct public API key (`e1ac1fa8-286e-4dfd-9c5c-2d36e1cc95e8`)
   - Verify the private API key is correct (`d1529b85-51d5-47c0-9332-a73d40f7d62b`)
   - Confirm the organization ID is correct (`8ddf2438-8b84-42c2-973c-4b7a69272a99`)

### Testing VAPI Integration

Use the debugging scripts to test VAPI integration directly:

```bash
# Basic test script
npx ts-node vapi_test.ts

# Comprehensive debugging script
npx ts-node vapi_debug.ts
```

These scripts bypass the application and make direct API calls to VAPI, which can help isolate issues. The `vapi_debug.ts` script provides more detailed diagnostics including:

- Checking assistant configuration
- Verifying phone number setup
- Making a test call
- Monitoring call status in real-time

## Server URL Configuration

VAPI requires a server URL to send webhook events to. This is crucial for receiving call events and updates.

### Server URL Priority

VAPI uses the following priority order for server URLs:

1. **Function:** Highest priority - for function call events
2. **Assistant:** Second highest priority
3. **Phone Number:** Third priority
4. **Account-wide:** Lowest priority (default fallback)

### Setting Server URLs

For this application, we need to set the server URL at both the assistant and phone number level:

```bash
# Run the debug script to check and update server URLs
npx ts-node vapi_debug.ts
```

The server URL should be: `http://localhost:3004/api/webhooks/vapi` for local development.

## Webhook Debugging

The VAPI webhook is crucial for receiving call events. To debug webhook issues:

1. **Check Server Logs**:
   - Look for incoming webhook requests in your server logs
   - Verify that the webhook handler is processing events correctly

2. **Verify Server URLs**:
   - Ensure your server URL is correctly configured at all levels (assistant, phone number)
   - For local development, use ngrok to create a public URL that forwards to your local server
   - The URL should be publicly accessible (not localhost unless using a tunnel)

3. **Test Webhook Locally**:
   - Use a tool like ngrok to expose your local server to the internet
   - Configure VAPI to send webhooks to your ngrok URL

## Logging and Monitoring

Enable detailed logging for better debugging:

1. **Server-side Logs**:
   - Check the server console for detailed logs
   - Look for VAPI webhook events and API call responses

2. **Database Monitoring**:
   - Check the Supabase database to see if call records are being created
   - Verify that webhook events are updating call records correctly

## VAPI Dashboard

The VAPI dashboard provides valuable information for debugging:

1. **Call Logs**:
   - Check the call logs in the VAPI dashboard
   - Look for failed calls and error messages

2. **Assistant Configuration**:
   - Verify that your assistant is configured correctly
   - Check for any warnings or errors in the assistant configuration

## Twilio Integration

Since you're using a Twilio number with VAPI:

1. **Twilio Dashboard**:
   - Check the Twilio dashboard for call logs
   - Verify that your Twilio number is active and properly configured

2. **Twilio Webhook Configuration**:
   - Ensure the Twilio webhook is correctly pointing to VAPI
   - Check for any errors in the Twilio logs

## Testing Checklist

When testing VAPI integration:

1. Start with a simple test call using the `vapi_test.ts` script
2. Check the console logs for any errors
3. Verify that the call record is created in the database
4. Check the VAPI dashboard for call status
5. Monitor webhook events in the server logs
6. Verify that call status updates are reflected in the database

## Contact VAPI Support

If you've tried all the above steps and still have issues, contact VAPI support with:

1. Your assistant ID
2. The phone number you're trying to call
3. The Twilio number you're using
4. Any error messages from the console or server logs
5. The call ID if a call was initiated but failed
