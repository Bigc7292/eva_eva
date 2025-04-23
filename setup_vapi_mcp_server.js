#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration
const VAPI_TOKEN = process.env.VAPI_TOKEN || "d1529b85-51d5-47c0-9332-a73d40f7d62b";
const ASSISTANT_ID = process.env.ASSISTANT_ID || "cfaa163c-4a47-471b-a39e-95c12d0cb738";

async function main() {
  try {
    // Initialize MCP client
    const mcpClient = new Client({
      name: 'vapi-client-example',
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
      // List available tools
      const toolsResult = await mcpClient.listTools();
      console.log('Available tools:');
      toolsResult.tools.forEach((tool) => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });
      
      // List assistants
      console.log('\nListing assistants...');
      const assistantsResponse = await mcpClient.callTool({
        name: 'list_assistants',
        arguments: {},
      });
      
      const assistants = parseToolResponse(assistantsResponse);
      console.log('Your assistants:');
      if (Array.isArray(assistants) && assistants.length > 0) {
        assistants.forEach((assistant) => {
          console.log(`- ${assistant.name} (${assistant.id})`);
        });
      } else {
        console.log('No assistants found or unable to parse response.');
      }
      
      // Get specific assistant
      console.log(`\nGetting assistant details for ID: ${ASSISTANT_ID}...`);
      const assistantResponse = await mcpClient.callTool({
        name: 'get_assistant',
        arguments: {
          assistantId: ASSISTANT_ID
        },
      });
      
      const assistant = parseToolResponse(assistantResponse);
      console.log('Assistant details:', JSON.stringify(assistant, null, 2));
      
      // List phone numbers
      console.log('\nListing phone numbers...');
      const phoneNumbersResponse = await mcpClient.callTool({
        name: 'list_phone_numbers',
        arguments: {},
      });
      
      const phoneNumbers = parseToolResponse(phoneNumbersResponse);
      console.log('Your phone numbers:');
      if (Array.isArray(phoneNumbers) && phoneNumbers.length > 0) {
        phoneNumbers.forEach((phoneNumber) => {
          console.log(`- ${phoneNumber.phoneNumber} (${phoneNumber.id})`);
        });
        
        // Get the first phone number ID for potential call creation
        const phoneNumberId = phoneNumbers[0].id;
        console.log(`\nFirst phone number ID: ${phoneNumberId}`);
        
        // Ask if user wants to create a call
        console.log('\nTo create a call, run the following command:');
        console.log(`node create_vapi_call.js ${ASSISTANT_ID} ${phoneNumberId} +1234567890`);
      } else {
        console.log('No phone numbers found or unable to parse response.');
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
