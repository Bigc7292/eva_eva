#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get command line arguments
const assistantId = process.argv[2] || process.env.ASSISTANT_ID || "cfaa163c-4a47-471b-a39e-95c12d0cb738";
const phoneNumberId = process.argv[3];
const customerPhoneNumber = process.argv[4];

// Configuration
const VAPI_TOKEN = process.env.VAPI_TOKEN || "d1529b85-51d5-47c0-9332-a73d40f7d62b";

// Validate required parameters
if (!phoneNumberId) {
  console.error('Error: Phone number ID is required');
  console.log('Usage: node create_vapi_call.js [assistantId] [phoneNumberId] [customerPhoneNumber]');
  process.exit(1);
}

if (!customerPhoneNumber) {
  console.error('Error: Customer phone number is required');
  console.log('Usage: node create_vapi_call.js [assistantId] [phoneNumberId] [customerPhoneNumber]');
  process.exit(1);
}

async function main() {
  try {
    // Initialize MCP client
    const mcpClient = new Client({
      name: 'vapi-call-creator',
      version: '1.0.0',
    });
    
    // Create SSE transport for connection to remote Vapi MCP server
    const serverUrl = 'https://mcp.vapi.ai/sse';
    const headers = {
      Authorization: `Bearer ${VAPI_TOKEN}`,
    };
    const options = {
      requestInit: { headers: headers },
      eventSourceInit: {
        fetch: (url, init) => {
          return fetch(url, {
            ...(init || {}),
            headers: {
              ...(init?.headers || {}),
              ...headers,
            },
          });
        },
      },
    };
    const transport = new SSEClientTransport(new URL(serverUrl), options);
    
    console.log('Connecting to Vapi MCP server via SSE...');
    await mcpClient.connect(transport);
    console.log('Connected successfully');

    // Helper function to parse tool responses
    function parseToolResponse(response) {
      if (!response?.content) return response;
      const textItem = response.content.find(item => item.type === 'text');
      if (textItem?.text) {
        try {
          return JSON.parse(textItem.text);
        } catch {
          return textItem.text;
        }
      }
      return response;
    }
    
    try {
      // Create a call
      console.log(`Creating a call using assistant (${assistantId}) and phone number (${phoneNumberId})...`);
      console.log(`Customer phone number: ${customerPhoneNumber}`);
      
      const createCallResponse = await mcpClient.callTool({
        name: 'create_call',
        arguments: {
          assistantId: assistantId,
          phoneNumberId: phoneNumberId,
          customer: {
            phoneNumber: customerPhoneNumber
          },
          // Optional: Add a name for the call
          name: `Test Call ${new Date().toISOString()}`
          // Optional: schedule a call for the future
          // scheduledAt: "2025-04-15T15:30:00Z"
        },
      });
      
      const createdCall = parseToolResponse(createCallResponse);
      console.log('Call created:', JSON.stringify(createdCall, null, 2));
      
      // Get call details
      if (createdCall && createdCall.id) {
        console.log(`\nGetting details for call ${createdCall.id}...`);
        const callDetailsResponse = await mcpClient.callTool({
          name: 'get_call',
          arguments: {
            callId: createdCall.id
          },
        });
        
        const callDetails = parseToolResponse(callDetailsResponse);
        console.log('Call details:', JSON.stringify(callDetails, null, 2));
      }
    } finally {
      console.log('\nDisconnecting from server...');
      await mcpClient.close();
      console.log('Disconnected');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
