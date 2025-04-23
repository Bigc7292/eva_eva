# Vapi Real Estate Workflow Creator

This tool creates a real estate lead qualification workflow using the Vapi MCP Server. It follows the structure outlined in the Vapi AI Workflow and Tools Integration Guide.

## What This Tool Does

1. Creates a property search tool that can search for properties based on:
   - Location in Dubai
   - Property type
   - Budget

2. Creates a workflow with the following steps:
   - Greeting the caller
   - Gathering location preferences
   - Gathering property type preferences
   - Gathering budget information
   - Searching for properties using the created tool
   - Thanking the caller and promising follow-up

3. Associates the workflow with your Vapi assistant

## Setup Instructions

### Prerequisites

- Node.js installed on your machine
- Vapi API key (already included in the scripts)
- Your Vapi assistant ID (already included in the scripts)

### Installation

1. Navigate to the vapi-workflow directory:

```bash
cd vapi-workflow
```

2. Install the required dependencies:

```bash
npm install
```

## Usage

### Create the Workflow

Run the workflow creation script:

```bash
npm run create-workflow
```

This will:
- Connect to the Vapi MCP Server
- Create a property search tool
- Create a real estate lead qualification workflow
- Associate the workflow with your assistant
- Save the workflow ID to a file for future reference

### Test the Workflow

After creating the workflow, you can test it in two ways:

#### Option 1: Use the test script

Run the test workflow script with a phone number to call:

```bash
npm run test-workflow -- +1234567890
```

Replace `+1234567890` with the actual phone number you want to call.

This will:
- Connect to the Vapi MCP Server
- List your phone numbers
- Create a call using your assistant and the first phone number in your account
- Get details for the created call

#### Option 2: Use the Vapi dashboard

1. Go to the Vapi dashboard (https://dashboard.vapi.ai)
2. Navigate to your assistant
3. Make a call using the assistant
4. Monitor the call to ensure the workflow is working correctly

## Workflow Structure

The workflow follows this structure:

1. **Start Node**: Greets the caller and asks if it's a good time to talk.
2. **Input Nodes**: Collect information about location, property type, and budget.
3. **Function Node**: Calls the property search tool with the collected information.
4. **Say Node**: Thanks the caller and promises follow-up.
5. **End Node**: Ends the call.

## Customization

You can customize the workflow by modifying the `create_real_estate_workflow_mcp.js` file:

- Change the prompts in the nodes
- Add additional nodes for more information gathering
- Modify the tool parameters to collect different information

## Troubleshooting

If you encounter any issues:

1. Check that your Vapi API key is correct
2. Ensure that your assistant ID is valid
3. Make sure you have an active internet connection
4. Check the Vapi dashboard for any account-related issues

## References

- [Vapi MCP Server Repository](https://github.com/VapiAI/mcp-server)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Vapi Dashboard](https://dashboard.vapi.ai)
