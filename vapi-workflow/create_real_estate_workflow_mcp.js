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

async function main() {
  try {
    // Initialize MCP client
    const mcpClient = new Client({
      name: 'vapi-workflow-creator',
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
      
      // Step 1: Create a property search tool
      console.log('\nCreating property search tool...');
      const createToolResponse = await mcpClient.callTool({
        name: 'create_tool',
        arguments: {
          name: "PropertySearchTool",
          type: "function",
          function: {
            name: "searchProperties",
            description: "Searches for properties based on location, type, and budget",
            parameters: {
              type: "object",
              properties: {
                location: {type: "string", description: "Location in Dubai (e.g., Dubai Marina, Downtown)"},
                property_type: {type: "string", description: "Type of property (e.g., Apartment, Villa)"},
                budget: {type: "string", description: "Budget in USD (can be a range or single value)"}
              },
              required: ["location", "property_type", "budget"]
            }
          }
        }
      });
      
      const createdTool = parseToolResponse(createToolResponse);
      console.log('Tool created:', JSON.stringify(createdTool, null, 2));
      
      // Extract tool ID
      const toolId = createdTool?.id;
      if (!toolId) {
        console.error('Failed to get tool ID from response');
        return;
      }
      
      console.log(`Tool ID: ${toolId}`);
      
      // Step 2: Create a real estate workflow
      console.log('\nCreating real estate workflow...');
      
      // Define the workflow
      const workflow = {
        name: "RealEstateLeadQualificationWorkflow",
        assistantId: ASSISTANT_ID,
        workflow: {
          nodes: [
            {
              id: "start",
              type: "start",
              data: { prompt: "Welcome to our luxury real estate service. I'd like to understand your property preferences. Is this a good time to talk?" }
            },
            {
              id: "gather_location",
              type: "input",
              data: { variable: "location", prompt: "Which area in Dubai are you interested in? For example, Dubai Marina, Downtown, Palm Jumeirah, etc." }
            },
            {
              id: "gather_property_type",
              type: "input",
              data: { variable: "property_type", prompt: "What type of property are you looking for? For example, apartment, villa, penthouse, etc." }
            },
            {
              id: "gather_budget",
              type: "input",
              data: { variable: "budget", prompt: "What's your budget in USD? You can give me a range or a specific amount." }
            },
            {
              id: "search_properties",
              type: "function",
              data: {
                toolId: toolId,
                functionName: "searchProperties",
                parameters: {
                  location: "{{location}}",
                  property_type: "{{property_type}}",
                  budget: "{{budget}}"
                }
              }
            },
            {
              id: "thank_you",
              type: "say",
              data: { prompt: "Thank you for sharing your preferences. I'll help you find properties that match your criteria. A real estate specialist will contact you soon with options." }
            },
            {
              id: "end",
              type: "end",
              data: {}
            }
          ],
          edges: [
            { source: "start", target: "gather_location" },
            { source: "gather_location", target: "gather_property_type" },
            { source: "gather_property_type", target: "gather_budget" },
            { source: "gather_budget", target: "search_properties" },
            { source: "search_properties", target: "thank_you" },
            { source: "thank_you", target: "end" }
          ]
        }
      };
      
      const createWorkflowResponse = await mcpClient.callTool({
        name: 'create_workflow',
        arguments: workflow
      });
      
      const createdWorkflow = parseToolResponse(createWorkflowResponse);
      console.log('Workflow created:', JSON.stringify(createdWorkflow, null, 2));
      
      // Extract workflow ID
      const workflowId = createdWorkflow?.id;
      if (!workflowId) {
        console.error('Failed to get workflow ID from response');
        return;
      }
      
      console.log(`Workflow ID: ${workflowId}`);
      
      // Save workflow ID to file for future reference
      fs.writeFileSync('workflow_id.txt', workflowId);
      
      // Step 3: Get workflow details to verify
      console.log('\nGetting workflow details...');
      const getWorkflowResponse = await mcpClient.callTool({
        name: 'get_workflow',
        arguments: {
          workflowId: workflowId
        }
      });
      
      const workflowDetails = parseToolResponse(getWorkflowResponse);
      console.log('Workflow details:', JSON.stringify(workflowDetails, null, 2));
      
      // Step 4: Update assistant to use the workflow
      console.log('\nUpdating assistant to use the workflow...');
      const updateAssistantResponse = await mcpClient.callTool({
        name: 'update_assistant',
        arguments: {
          assistantId: ASSISTANT_ID,
          workflow_id: workflowId
        }
      });
      
      const updatedAssistant = parseToolResponse(updateAssistantResponse);
      console.log('Assistant updated:', JSON.stringify(updatedAssistant, null, 2));
      
      console.log('\n=== Workflow Setup Complete ===');
      console.log(`Tool ID: ${toolId}`);
      console.log(`Workflow ID: ${workflowId}`);
      console.log(`Assistant ID: ${ASSISTANT_ID}`);
      console.log('\nNext steps:');
      console.log('1. Test the workflow by making a call using the assistant');
      console.log('2. Monitor the call in the Vapi dashboard');
      
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
