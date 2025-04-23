#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Configuration
const VAPI_TOKEN = process.env.VAPI_TOKEN || "d1529b85-51d5-47c0-9332-a73d40f7d62b";
const ASSISTANT_ID = process.env.ASSISTANT_ID || "cfaa163c-4a47-471b-a39e-95c12d0cb738";

// Get workflow ID from file if it exists
let WORKFLOW_ID;
try {
  WORKFLOW_ID = fs.readFileSync('workflow_id.txt', 'utf8').trim();
} catch (error) {
  console.error('Error reading workflow ID from file. Please create a workflow first.');
  process.exit(1);
}

// Get phone number from command line arguments
const PHONE_NUMBER = process.argv[2];
if (!PHONE_NUMBER) {
  console.error('Error: Phone number is required');
  console.log('Usage: node test_workflow.js [phone_number]');
  console.log('Example: node test_workflow.js +1234567890');
  process.exit(1);
}

async function main() {
  try {
    // Initialize MCP client
    const mcpClient = new Client({
      name: 'vapi-workflow-tester',
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
      // List phone numbers
      console.log('\nListing phone numbers...');
      const phoneNumbersResponse = await mcpClient.callTool({
        name: 'list_phone_numbers',
        arguments: {}
      });
      
      const phoneNumbers = parseToolResponse(phoneNumbersResponse);
      console.log('Your phone numbers:');
      if (Array.isArray(phoneNumbers) && phoneNumbers.length > 0) {
        phoneNumbers.forEach((phoneNumber) => {
          console.log(`- ${phoneNumber.phoneNumber} (${phoneNumber.id})`);
        });
        
        // Get the first phone number ID
        const phoneNumberId = phoneNumbers[0].id;
        console.log(`\nUsing phone number ID: ${phoneNumberId}`);
        
        // Create a call
        console.log(`\nCreating a call to ${PHONE_NUMBER} using workflow ${WORKFLOW_ID}...`);
        const createCallResponse = await mcpClient.callTool({
          name: 'create_call',
          arguments: {
            assistantId: ASSISTANT_ID,
            phoneNumberId: phoneNumberId,
            customer: {
              phoneNumber: PHONE_NUMBER
            },
            name: `Test Call ${new Date().toISOString()}`
          }
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
            }
          });
          
          const callDetails = parseToolResponse(callDetailsResponse);
          console.log('Call details:', JSON.stringify(callDetails, null, 2));
        }
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
