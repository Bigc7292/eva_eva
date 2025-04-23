/**
 * Test Vapi Workflow
 * 
 * This script tests the Vapi workflow by making a call to a test phone number.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = process.env.VAPI_PRIVATE_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || 'e65a9e6b-33b7-4711-ad21-90220048e38f';

// Test phone number to call
const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '+971565401583';

// Workflow ID (replace with your workflow ID after creation)
const WORKFLOW_ID = process.env.WORKFLOW_ID || '';

/**
 * Make a call using the workflow
 */
async function makeCallWithWorkflow() {
  try {
    console.log(`Making call to ${TEST_PHONE_NUMBER} using workflow ${WORKFLOW_ID}...`);
    
    const response = await fetch(`${VAPI_API_URL}/call/phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        assistantId: ASSISTANT_ID,
        phoneNumberId: PHONE_NUMBER_ID,
        customer: {
          number: TEST_PHONE_NUMBER
        },
        name: `WorkflowTest_${Date.now()}`,
        workflowId: WORKFLOW_ID,
        metadata: {
          test: true,
          source: 'test_workflow_script',
          timestamp: new Date().toISOString()
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error making call: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Call initiated successfully!');
    console.log('Call ID:', data.id);
    console.log('Status:', data.status);
    
    return data;
  } catch (error) {
    console.error('Error making call:', error);
    return null;
  }
}

/**
 * Check call status
 */
async function checkCallStatus(callId) {
  try {
    console.log(`Checking status for call ${callId}...`);
    
    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error checking call status: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Call Status:', data.status);
    
    return data;
  } catch (error) {
    console.error('Error checking call status:', error);
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
    
    // Make the call
    const call = await makeCallWithWorkflow();
    
    if (!call) {
      console.error('Failed to make call');
      return;
    }
    
    // Wait 10 seconds
    console.log('Waiting 10 seconds to check status...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check call status
    await checkCallStatus(call.id);
    
    console.log('\nTest completed. The call should be in progress.');
    console.log('Check the VAPI dashboard for call details and recordings.');
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
main();
