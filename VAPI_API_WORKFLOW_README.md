# Vapi API Workflow Implementation

This project implements a real estate lead qualification workflow using the Vapi API. It creates custom tools and a workflow that guides potential real estate clients through a qualification process, from collecting their preferences to scheduling a meeting.

## Prerequisites

Before you begin, make sure you have:

1. Python 3.6+ installed
2. A Vapi account with API access
3. Your Vapi API keys
4. An existing Vapi assistant
5. A Vapi phone number

## Setup

1. Clone this repository or download the scripts
2. Install the required Python packages:

```bash
pip install requests python-dotenv
```

3. Create a `.env` file in the same directory as the scripts with the following variables:

```
VAPI_PRIVATE_KEY=your-private-api-key
VAPI_PUBLIC_KEY=your-public-api-key
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_PHONE_NUMBER_ID=your-phone-number-id
BASE_URL=http://localhost:3004
```

Replace the values with your actual Vapi credentials and API server URL.

## Scripts

This project includes the following scripts:

1. **create_real_estate_workflow_api.py**: Creates the tools and workflow in Vapi and assigns it to your assistant.
2. **test_vapi_tools.py**: Tests the tools to ensure they're working correctly.
3. **test_vapi_workflow.py**: Tests the workflow by making a call and checking its status.

## Usage

### Creating the Workflow

Run the workflow creation script:

```bash
python create_real_estate_workflow_api.py
```

This script will:
1. Create four tools in your Vapi account:
   - PropertySearchTool: Searches for properties based on location, type, and budget
   - CalendarSlotsTool: Gets available calendar slots
   - BookingTool: Books a calendar slot
   - LeadTool: Creates a lead in the CRM
2. Create a workflow with 33 nodes that implement the real estate lead qualification flow
3. Assign the workflow to your assistant

### Testing the Tools

Run the tool testing script:

```bash
python test_vapi_tools.py
```

This script will:
1. List all tools in your Vapi account
2. Allow you to select which tools to test
3. Test each selected tool by:
   - Testing the API endpoint directly
   - Testing the tool through the Vapi API

### Testing the Workflow

Run the workflow testing script:

```bash
python test_vapi_workflow.py
```

This script will:
1. Check if your assistant has a workflow assigned
2. Get details about the assigned workflow
3. Allow you to make a test call to verify the workflow

## Workflow Structure

The workflow consists of 33 nodes that implement the following flow:

1. **Start Call**: Initiates the call with a greeting
2. **Gather Good Time**: Collects whether it's a good time to talk
3. **Check Good Time**: Branches based on whether it's a good time
4. **Gather Location**: Collects preferred location in Dubai
5. **Gather Property Type**: Collects property type preference
6. **Gather Budget**: Collects budget information
7. **Gather Timeframe**: Collects purchase timeframe
8. **Gather Purpose**: Collects purpose (investment or personal use)
9. **Search Properties**: Calls the PropertySearchTool to find matching properties
10. **Check Properties Exist**: Branches based on whether properties are found
11. **Gather Preferred Time**: Collects preferred meeting time
12. **Get Available Slots**: Calls the CalendarSlotsTool to get available slots
13. **Check Slots Available**: Branches based on whether slots are available
14. **Present Available Slots**: Presents the available slots to the caller
15. **Gather Selected Slot**: Collects the selected slot
16. **Book Slot**: Calls the BookingTool to book the selected slot
17. **Check Booking Success**: Branches based on whether booking was successful
18. **Gather Full Name**: Collects the caller's full name
19. **Gather Email**: Collects the caller's email
20. **Say Not a Good Time**: Handles the case when it's not a good time
21. **Gather Callback Time**: Collects preferred callback time
22. **Confirm Callback**: Confirms the callback time
23. **End Callback**: Ends the call after scheduling a callback
24. **Say No Properties**: Handles the case when no properties are found
25. **End No Properties**: Ends the call when no properties are found
26. **Say No Slots**: Handles the case when no slots are available
27. **Say Booking Failed**: Handles the case when booking fails
28. **Confirm Email**: Asks for email confirmation
29. **Gather Email Confirmation**: Collects email confirmation
30. **Check Email Confirmation**: Branches based on email confirmation
31. **Create Lead**: Calls the LeadTool to create a lead in the CRM
32. **Confirm Booking**: Confirms the booking details
33. **End Success**: Ends the call after successful booking

## API Endpoints

The workflow relies on the following API endpoints:

1. `/api/properties`: Searches for properties based on location, type, and budget
2. `/api/calendar/available_slots`: Gets available calendar slots
3. `/api/calendar/book`: Books a calendar slot
4. `/api/leads`: Creates a lead in the CRM

Make sure these endpoints are implemented and working correctly in your API server.

## Troubleshooting

### Tool Creation Issues

If you encounter issues creating tools:
1. Check your Vapi API key
2. Verify that your account has permission to create tools
3. Check the error message in the response

### Workflow Creation Issues

If you encounter issues creating the workflow:
1. Check your Vapi API key
2. Verify that your account has permission to create workflows
3. Check the error message in the response
4. Verify that the tool IDs are correct

### Call Issues

If calls are not working correctly:
1. Check that your assistant is correctly configured
2. Verify that your phone number is assigned to your assistant
3. Check the Vapi dashboard for call logs and errors
4. Verify that your API endpoints are working correctly

## Customization

You can customize the workflow by:
1. Modifying the node prompts in the `create_real_estate_workflow_api.py` script
2. Adding additional nodes for more complex scenarios
3. Changing the API endpoints to match your specific requirements
4. Adding error handling nodes

## Conclusion

This implementation provides a complete solution for real estate lead qualification using the Vapi API. By following the instructions in this README, you can create and test a workflow that guides potential clients through the qualification process, from collecting their preferences to scheduling a meeting.
