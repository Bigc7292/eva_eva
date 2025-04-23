/**
 * Check Vapi Assistant Configuration
 * 
 * This script checks if your Vapi assistant is properly configured.
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = process.env.VAPI_PRIVATE_KEY || 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || 'e65a9e6b-33b7-4711-ad21-90220048e38f';

/**
 * Check assistant configuration
 */
async function checkAssistant() {
  try {
    console.log(`Checking assistant ${ASSISTANT_ID}...`);
    
    const response = await fetch(`${VAPI_API_URL}/assistants/${ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error getting assistant: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Assistant retrieved successfully!');
    console.log('Assistant Name:', data.name);
    
    // Check if workflow is assigned
    if (data.workflow_id) {
      console.log('✅ Workflow is assigned to assistant');
      console.log('Workflow ID:', data.workflow_id);
    } else {
      console.log('❌ No workflow assigned to assistant');
    }
    
    // Check other important configurations
    console.log('\nAssistant Configuration:');
    console.log('- LLM Provider:', data.llm?.provider || 'Not set');
    console.log('- LLM Model:', data.llm?.model || 'Not set');
    console.log('- Voice Provider:', data.voice?.provider || 'Not set');
    console.log('- Recording Enabled:', data.recordingEnabled ? '✅ Yes' : '❌ No');
    
    return data;
  } catch (error) {
    console.error('❌ Error checking assistant:', error);
    return null;
  }
}

/**
 * Check phone number configuration
 */
async function checkPhoneNumber() {
  try {
    console.log(`\nChecking phone number ${PHONE_NUMBER_ID}...`);
    
    const response = await fetch(`${VAPI_API_URL}/phone_numbers/${PHONE_NUMBER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error getting phone number: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Phone number retrieved successfully!');
    console.log('Phone Number:', data.phone_number);
    
    // Check if assistant is assigned
    if (data.assistant_id === ASSISTANT_ID) {
      console.log('✅ Phone number is assigned to the correct assistant');
    } else if (data.assistant_id) {
      console.log(`❌ Phone number is assigned to a different assistant: ${data.assistant_id}`);
    } else {
      console.log('❌ No assistant assigned to phone number');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error checking phone number:', error);
    return null;
  }
}

/**
 * Check webhooks configuration
 */
async function checkWebhooks() {
  try {
    console.log('\nChecking webhooks...');
    
    const response = await fetch(`${VAPI_API_URL}/webhooks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error getting webhooks: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Webhooks retrieved successfully!');
    
    if (data.length === 0) {
      console.log('❌ No webhooks configured');
      return [];
    }
    
    console.log(`Found ${data.length} webhooks:`);
    
    data.forEach((webhook, index) => {
      console.log(`\nWebhook ${index + 1}:`);
      console.log('- URL:', webhook.url);
      console.log('- Active:', webhook.active ? '✅ Yes' : '❌ No');
      console.log('- Events:', webhook.events.join(', '));
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error checking webhooks:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('=== Checking Vapi Assistant Configuration ===');
    
    // Check assistant
    const assistant = await checkAssistant();
    
    // Check phone number
    const phoneNumber = await checkPhoneNumber();
    
    // Check webhooks
    const webhooks = await checkWebhooks();
    
    // Summary
    console.log('\n=== Configuration Summary ===');
    
    if (assistant) {
      if (assistant.workflow_id) {
        console.log('✅ Assistant is configured with a workflow');
      } else {
        console.log('❌ Assistant is not configured with a workflow');
        console.log('   Run assign-workflow-to-assistant.js to assign a workflow');
      }
    } else {
      console.log('❌ Could not check assistant configuration');
    }
    
    if (phoneNumber) {
      if (phoneNumber.assistant_id === ASSISTANT_ID) {
        console.log('✅ Phone number is correctly configured');
      } else {
        console.log('❌ Phone number is not correctly configured');
        console.log('   Update the phone number to use the correct assistant');
      }
    } else {
      console.log('❌ Could not check phone number configuration');
    }
    
    if (webhooks) {
      const activeWebhooks = webhooks.filter(webhook => webhook.active);
      if (activeWebhooks.length > 0) {
        console.log('✅ Webhooks are configured');
      } else {
        console.log('❌ No active webhooks configured');
        console.log('   Configure webhooks to receive call events');
      }
    } else {
      console.log('❌ Could not check webhooks configuration');
    }
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
main();
