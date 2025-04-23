/**
 * Update Workflow BASE_URL
 * 
 * This script updates the BASE_URL in a Vapi workflow to point to your API server.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = process.env.VAPI_PRIVATE_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';

// Workflow ID (replace with your workflow ID)
const WORKFLOW_ID = process.env.WORKFLOW_ID || '';

// Base URL for API endpoints
const BASE_URL = process.env.BASE_URL || 'https://your-api-server.com';

/**
 * Get workflow details
 */
async function getWorkflow() {
  try {
    console.log(`Getting workflow ${WORKFLOW_ID}...`);
    
    const response = await fetch(`${VAPI_API_URL}/workflows/${WORKFLOW_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting workflow: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Workflow retrieved successfully!');
    console.log('Workflow Name:', data.name);
    
    return data;
  } catch (error) {
    console.error('Error getting workflow:', error);
    return null;
  }
}

/**
 * Update workflow BASE_URL
 */
async function updateWorkflowBaseUrl(workflow) {
  try {
    console.log(`Updating BASE_URL to ${BASE_URL}...`);
    
    // Find API request nodes
    const apiNodes = workflow.nodes.filter(node => node.type === 'api_request');
    
    if (apiNodes.length === 0) {
      console.error('No API request nodes found in workflow');
      return null;
    }
    
    console.log(`Found ${apiNodes.length} API request nodes`);
    
    // Update URLs in API request nodes
    const updatedNodes = workflow.nodes.map(node => {
      if (node.type === 'api_request') {
        // Replace {{BASE_URL}} with the actual base URL
        const updatedUrl = node.data.url.replace('{{BASE_URL}}', BASE_URL);
        
        return {
          ...node,
          data: {
            ...node.data,
            url: updatedUrl
          }
        };
      }
      
      return node;
    });
    
    // Create updated workflow
    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes
    };
    
    // Update workflow in Vapi
    const response = await fetch(`${VAPI_API_URL}/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify(updatedWorkflow)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating workflow: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Workflow updated successfully!');
    
    return data;
  } catch (error) {
    console.error('Error updating workflow:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    if (!WORKFLOW_ID) {
      console.error('Workflow ID is required. Please set the WORKFLOW_ID environment variable.');
      return;
    }
    
    if (!BASE_URL) {
      console.error('Base URL is required. Please set the BASE_URL environment variable.');
      return;
    }
    
    // Get workflow
    const workflow = await getWorkflow();
    
    if (!workflow) {
      console.error('Failed to get workflow');
      return;
    }
    
    // Update workflow BASE_URL
    const updatedWorkflow = await updateWorkflowBaseUrl(workflow);
    
    if (!updatedWorkflow) {
      console.error('Failed to update workflow');
      return;
    }
    
    console.log('\nWorkflow updated successfully. API request nodes now use the following base URL:');
    console.log(BASE_URL);
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
main();
