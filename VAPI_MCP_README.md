# Vapi MCP Server Integration

This guide provides instructions for setting up and using the Vapi Model Context Protocol (MCP) Server to interact with Vapi's services programmatically.

## What is Vapi MCP Server?

Vapi MCP Server is an implementation of the Model Context Protocol that exposes Vapi's APIs as callable tools. This allows you to access Vapi functionality, including:

- Listing, creating, and managing Vapi assistants
- Managing phone numbers
- Creating and scheduling outbound calls
- Retrieving call details and status

## Setup Instructions

### Prerequisites

- Node.js installed on your machine
- Vapi API key (already included in the scripts)
- Your Vapi assistant ID (already included in the scripts)

### Installation

1. Install the required dependencies:

```bash
npm install @modelcontextprotocol/sdk dotenv
npm install -g @vapi-ai/mcp-server
```

2. Set up environment variables:

```bash
# Copy the .env.mcp file to .env
cp .env.mcp .env
```

## Usage

### Option 1: Run the Local MCP Server

You can run the Vapi MCP Server locally for development or testing:

```bash
npx -y @vapi-ai/mcp-server
```

This will start a local server that exposes Vapi's APIs as callable tools.

### Option 2: Connect to the Remote MCP Server

The scripts in this repository are configured to connect to Vapi's hosted MCP server via Server-Sent Events (SSE).

#### List Assistants and Phone Numbers

Run the setup script to list your assistants and phone numbers:

```bash
node setup_vapi_mcp_server.js
```

This will:
- Connect to the Vapi MCP Server
- List available tools
- List your assistants
- Get details for your specified assistant
- List your phone numbers

#### Create a Call

To create a call, run the create_call script with the following parameters:

```bash
node create_vapi_call.js [assistantId] [phoneNumberId] [customerPhoneNumber]
```

For example:

```bash
node create_vapi_call.js cfaa163c-4a47-471b-a39e-95c12d0cb738 53cb46fd-5e37-4860-8668-7594005f872a +1234567890
```

This will:
- Connect to the Vapi MCP Server
- Create a call using the specified assistant and phone number
- Get details for the created call

## Claude Desktop Integration

You can also integrate the Vapi MCP Server with Claude Desktop for a conversational interface:

1. Open Claude Desktop and press `CMD + ,` (Mac) or `Ctrl + ,` (Windows) to go to `Settings`
2. Click on the `Developer` tab
3. Click on the `Edit Config` button
4. Add the following configuration to the `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "vapi-mcp-server": {
      "command": "npx",
      "args": [
          "-y",
          "@vapi-ai/mcp-server"
      ],
      "env": {
        "VAPI_TOKEN": "d1529b85-51d5-47c0-9332-a73d40f7d62b"
      }
    }
  }
}
```

5. Save the file and restart Claude Desktop

Now you can ask Claude to help with Vapi-related tasks, such as:

- "I'd like to speak with my appointment scheduling assistant. Can you have it call me at +1234567890?"
- "Can you list all my Vapi assistants and help me create a new one for appointment scheduling?"

## Troubleshooting

If you encounter any issues:

1. Check that your Vapi API key is correct
2. Ensure that your assistant ID and phone number ID are valid
3. Make sure you have an active internet connection
4. Check the Vapi dashboard for any account-related issues

## References

- [Vapi MCP Server Repository](https://github.com/VapiAI/mcp-server)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Vapi Dashboard](https://dashboard.vapi.ai)
