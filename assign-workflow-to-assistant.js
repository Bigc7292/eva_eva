/**
 * Assign Workflow to Assistant
 * 
 * This script assigns a workflow to an existing Vapi assistant.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = process.env.VAPI_PRIVATE_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738';

// Workflow ID (replace with your workflow ID)
const WORKFLOW_ID = process.env.WORKFLOW_ID || '';

/**
 * Get assistant details
 */
async function getAssistant() {
  try {
    console.log(`Getting assistant ${ASSISTANT_ID}...`);
    
    const response = await fetch(`${VAPI_API_URL}/assistants/${ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting assistant: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Assistant retrieved successfully!');
    console.log('Assistant Name:', data.name);
    
    return data;
  } catch (error) {
    console.error('Error getting assistant:', error);
    return null;
  }
}

/**
 * Update assistant to use workflow
 */
async function assignWorkflowToAssistant(assistant) {
  try {
    console.log(`Assigning workflow ${WORKFLOW_ID} to assistant ${ASSISTANT_ID}...`);
    
    // Create updated assistant configuration
    const updatedAssistant = {
      ...assistant,
      workflow_id: WORKFLOW_ID
    };
    
    // Update assistant in Vapi
    const response = await fetch(`${VAPI_API_URL}/assistants/${ASSISTANT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify(updatedAssistant)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error updating assistant: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Assistant updated successfully!');
    console.log('Workflow ID:', data.workflow_id);
    
    return data;
  } catch (error) {
    console.error('Error updating assistant:', error);
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
    
    // Get assistant
    const assistant = await getAssistant();
    
    if (!assistant) {
      console.error('Failed to get assistant');
      return;
    }
    
    // Assign workflow to assistant
    const updatedAssistant = await assignWorkflowToAssistant(assistant);
    
    if (!updatedAssistant) {
      console.error('Failed to assign workflow to assistant');
      return;
    }
    
    console.log('\nWorkflow assigned to assistant successfully!');
    console.log('Assistant ID:', ASSISTANT_ID);
    console.log('Workflow ID:', WORKFLOW_ID);
    console.log('\nYour assistant is now configured to use the workflow for all calls.');
    console.log('You can test it by making a call using the assistant.');
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
main();
