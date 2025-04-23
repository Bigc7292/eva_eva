# Vapi Workflow for Real Estate Lead Qualification

This document provides instructions for setting up and using the Vapi workflow for real estate lead qualification.

## Overview

The workflow is designed to qualify real estate leads by:
1. Greeting the caller and checking if it's a good time to talk
2. Collecting information about their property preferences
3. Checking for matching properties
4. Scheduling a meeting if properties are available
5. Collecting contact information
6. Creating a lead in the CRM

## Prerequisites

- Vapi account with API access
- API server for handling property searches, calendar bookings, and CRM operations
- Environment variables set up with Vapi API keys and assistant ID

## Setup Instructions

### 1. Create the Workflow

Run the `create-vapi-workflow.js` script to create the workflow in Vapi:

```bash
node create-vapi-workflow.js
```

This will create a new workflow in your Vapi account and output the workflow ID.

### 2. Set Up API Endpoints

The workflow requires the following API endpoints:

- `/api/properties` - Search for properties based on location, type, and budget
- `/api/calendar/available_slots` - Get available calendar slots
- `/api/calendar/book` - Book a calendar slot
- `/api/leads` - Create a lead in the CRM

These endpoints are included in the project and should be deployed to your API server.

### 3. Update the Workflow Configuration

After creating the workflow, you need to update the `BASE_URL` in the workflow to point to your API server. You can do this in the Vapi dashboard:

1. Go to the Vapi dashboard
2. Navigate to Workflows
3. Select your workflow
4. Edit the API request nodes to update the URLs
5. Save the changes

### 4. Test the Workflow

Run the `test-vapi-workflow.js` script to test the workflow:

```bash
WORKFLOW_ID=your-workflow-id node test-vapi-workflow.js
```

Replace `your-workflow-id` with the ID of the workflow you created.

## Workflow Structure

The workflow consists of 34 nodes:

1. **Start Call** - Initiates the call
2. **Assistant** - Generates a personalized greeting
3. **Gather** - Collects whether it's a good time to talk
4. **Condition** - Checks if it's a good time
5. **Gather** - Collects preferred location
6. **Gather** - Collects property type
7. **Gather** - Collects budget
8. **Gather** - Collects timeframe
9. **Gather** - Collects purpose (investment or personal use)
10. **API Request** - Checks for matching properties
11. **Condition** - Checks if properties exist
12. **Gather** - Collects preferred meeting time
13. **API Request** - Checks calendar availability
14. **Condition** - Checks if slots are available
15. **Say** - Presents available slots
16. **Gather** - Collects selected slot
17. **API Request** - Books the calendar slot
18. **Condition** - Checks if booking was successful
19. **Gather** - Collects full name
20. **Gather** - Collects email
21. **Say** - Confirms email
22. **Gather** - Collects email confirmation
23. **Condition** - Checks email confirmation
24. **API Request** - Creates CRM lead
25. **Say** - Confirms booking
26. **End Call** - Ends the call
27. **Say** - Asks for a better time to call back
28. **Gather** - Collects callback time
29. **Say** - Confirms callback
30. **End Call** - Ends the call (callback)
31. **Say** - No matching properties
32. **End Call** - Ends the call (no properties)
33. **Say** - No available slots
34. **Say** - Booking failed

## Customization

You can customize the workflow by:

- Updating the prompts in the Assistant and Say nodes
- Adding additional nodes for more complex scenarios
- Modifying the API request nodes to match your API structure
- Adding additional conditions for more branching logic

## Troubleshooting

If you encounter issues with the workflow:

1. Check the Vapi dashboard for call logs and recordings
2. Verify that your API endpoints are working correctly
3. Check the console logs for any errors
4. Make sure your environment variables are set correctly

## Additional Resources

- [Vapi Documentation](https://docs.vapi.ai/)
- [Vapi Dashboard](https://dashboard.vapi.ai/)
- [Vapi API Reference](https://api.vapi.ai/docs)
