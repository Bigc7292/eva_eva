# Vapi Workflow Setup Guide

This guide provides step-by-step instructions for setting up and using the Vapi workflow for real estate lead qualification.

## Prerequisites

Before you begin, make sure you have:

1. A Vapi account with API access
2. Your Vapi API keys (public and private)
3. An existing Vapi assistant
4. A Vapi phone number
5. Node.js installed on your machine

## Step 1: Set Up Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
VAPI_PRIVATE_KEY=your-private-api-key
VAPI_PUBLIC_KEY=your-public-api-key
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_PHONE_NUMBER_ID=your-phone-number-id
BASE_URL=your-api-server-url
```

Replace the values with your actual Vapi credentials.

## Step 2: Check Your Vapi Assistant Configuration

Run the assistant check script to verify your Vapi assistant is properly configured:

```bash
node check-vapi-assistant.js
```

This will check:
- If your assistant exists and is accessible
- If your assistant has the necessary configurations (LLM, voice, recording)
- If your phone number is correctly assigned to your assistant
- If you have webhooks configured

Fix any issues before proceeding.

## Step 3: Check Your API Endpoints

Run the API check script to verify your API endpoints are working correctly:

```bash
node check-api-endpoints.js
```

This will check:
- `/api/properties` - Search for properties
- `/api/calendar/available_slots` - Get available calendar slots
- `/api/calendar/book` - Book a calendar slot
- `/api/leads` - Create a lead in the CRM

Fix any issues before proceeding.

## Step 4: Create the Workflow

Run the workflow creation script:

```bash
node create-vapi-workflow.js
```

This will create a new workflow in your Vapi account with all the nodes as specified in the requirements.

Make note of the workflow ID that is output by the script.

## Step 5: Update the Workflow BASE_URL

Run the workflow update script to set the BASE_URL for API requests:

```bash
WORKFLOW_ID=your-workflow-id BASE_URL=your-api-server-url node update-workflow-base-url.js
```

Replace `your-workflow-id` with the ID from step 4 and `your-api-server-url` with your actual API server URL.

## Step 6: Assign the Workflow to Your Assistant

Run the workflow assignment script:

```bash
WORKFLOW_ID=your-workflow-id node assign-workflow-to-assistant.js
```

This will update your Vapi assistant to use the workflow for all calls.

## Step 7: Test the Workflow

Run the workflow test script:

```bash
WORKFLOW_ID=your-workflow-id TEST_PHONE_NUMBER=your-test-phone-number node test-vapi-workflow.js
```

Replace `your-test-phone-number` with a phone number you want to test with.

## Step 8: Verify the Workflow

After making a test call:

1. Check the Vapi dashboard for call logs and recordings
2. Verify that the workflow is following the expected path
3. Check your database for new leads and meetings

## Troubleshooting

### Workflow Not Working

If the workflow is not working as expected:

1. Check the Vapi dashboard for call logs and errors
2. Verify that your API endpoints are working correctly
3. Check that your assistant is correctly configured with the workflow
4. Verify that your phone number is assigned to the correct assistant

### API Endpoints Not Working

If your API endpoints are not working:

1. Check that your API server is running
2. Verify that the endpoints are correctly implemented
3. Check for any errors in the server logs
4. Make sure your database is properly configured

### Assistant Not Using Workflow

If your assistant is not using the workflow:

1. Run `check-vapi-assistant.js` to verify the configuration
2. Make sure the workflow ID is correctly assigned to the assistant
3. Try reassigning the workflow using `assign-workflow-to-assistant.js`

## Advanced Configuration

### Customizing the Workflow

You can customize the workflow by:

1. Editing the workflow in the Vapi dashboard
2. Modifying the prompts in the Assistant and Say nodes
3. Adding additional nodes for more complex scenarios
4. Changing the API endpoints to match your specific requirements

### Webhook Integration

To receive call events in your application:

1. Set up a webhook endpoint in your application
2. Register the webhook with Vapi using the Vapi dashboard or API
3. Configure the webhook to receive the events you're interested in (e.g., call.started, call.ended, transcript.created)

### CRM Integration

To integrate with your CRM:

1. Modify the `/api/leads` endpoint to create leads in your CRM
2. Update the workflow to include any additional fields required by your CRM
3. Set up webhooks to update your CRM with call events

## Conclusion

You now have a fully functional Vapi workflow for real estate lead qualification. This workflow will:

1. Greet callers and check if it's a good time to talk
2. Collect information about their property preferences
3. Check for matching properties
4. Schedule meetings if properties are available
5. Collect contact information
6. Create leads in your CRM

For more information, refer to the [Vapi documentation](https://docs.vapi.ai/) or contact Vapi support.
