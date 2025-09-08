/**
 * Check VAPI Webhook Configuration
 * 
 * This script checks the current webhook configuration in VAPI
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';

/**
 * List all registered webhooks
 */
async function listWebhooks() {
  try {
    console.log('Listing all registered webhooks:');
    
    const response = await fetch(`${VAPI_API_URL}/webhooks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error listing webhooks: ${response.status} - ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`Found ${data.length} webhooks:`);
    
    data.forEach((webhook, index) => {
      console.log(`\nWebhook #${index + 1}:`);
      console.log(`ID: ${webhook.id}`);
      console.log(`URL: ${webhook.url}`);
      console.log(`Active: ${webhook.active}`);
      console.log(`Events: ${webhook.events.join(', ')}`);
    });
    
    return data;
  } catch (error) {
    console.error('Error listing webhooks:', error);
  }
}

/**
 * Get organization details
 */
async function getOrganizationDetails() {
  try {
    console.log('\nGetting organization details...');
    
    const response = await fetch(`${VAPI_API_URL}/organization/${ORGANIZATION_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting organization details: ${response.status} - ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('Organization ID:', data.id);
    console.log('Organization Name:', data.name);
    
    if (data.server && data.server.url) {
      console.log('Organization Server URL:', data.server.url);
    } else {
      console.log('Organization Server URL: Not set');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting organization details:', error);
  }
}

/**
 * Get assistant details
 */
async function getAssistantDetails() {
  try {
    console.log('\nGetting assistant details...');
    
    const response = await fetch(`${VAPI_API_URL}/assistant/${ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting assistant details: ${response.status} - ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('Assistant ID:', data.id);
    console.log('Assistant Name:', data.name);
    
    if (data.serverUrl) {
      console.log('Assistant Server URL:', data.serverUrl);
    } else {
      console.log('Assistant Server URL: Not set');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting assistant details:', error);
  }
}

/**
 * Get phone number details
 */
async function getPhoneNumberDetails() {
  try {
    console.log('\nGetting phone number details...');
    
    const response = await fetch(`${VAPI_API_URL}/phone-number/${PHONE_NUMBER_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting phone number details: ${response.status} - ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('Phone Number ID:', data.id);
    console.log('Phone Number:', data.phoneNumber);
    
    if (data.serverUrl) {
      console.log('Phone Number Server URL:', data.serverUrl);
    } else {
      console.log('Phone Number Server URL: Not set');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting phone number details:', error);
  }
}

/**
 * Check all webhook configurations
 */
async function checkAllWebhookConfigurations() {
  console.log('=== CHECKING VAPI WEBHOOK CONFIGURATIONS ===\n');
  
  // List all webhooks
  const webhooks = await listWebhooks();
  
  // Get organization details
  const organization = await getOrganizationDetails();
  
  // Get assistant details
  const assistant = await getAssistantDetails();
  
  // Get phone number details
  const phoneNumber = await getPhoneNumberDetails();
  
  // Summary
  console.log('\n=== WEBHOOK CONFIGURATION SUMMARY ===');
  
  // Check if any webhooks are registered
  if (webhooks && webhooks.length > 0) {
    console.log('✅ Webhooks are registered');
  } else {
    console.log('❌ No webhooks are registered');
  }
  
  // Check if organization server URL is set
  if (organization && organization.server && organization.server.url) {
    console.log('✅ Organization server URL is set');
  } else {
    console.log('❌ Organization server URL is not set');
  }
  
  // Check if assistant server URL is set
  if (assistant && assistant.serverUrl) {
    console.log('✅ Assistant server URL is set');
  } else {
    console.log('❌ Assistant server URL is not set');
  }
  
  // Check if phone number server URL is set
  if (phoneNumber && phoneNumber.serverUrl) {
    console.log('✅ Phone number server URL is set');
  } else {
    console.log('❌ Phone number server URL is not set');
  }
  
  console.log('\nRecommendation:');
  if (webhooks && webhooks.length > 0 && 
      ((organization && organization.server && organization.server.url) || 
       (assistant && assistant.serverUrl) || 
       (phoneNumber && phoneNumber.serverUrl))) {
    console.log('Your webhook configuration looks good. If you are still not receiving webhook events, check:');
    console.log('1. Your ngrok tunnel is running and forwarding to port 3004');
    console.log('2. Your webhook server is running on port 3004');
    console.log('3. The ngrok URL is correct and accessible');
  } else {
    console.log('Your webhook configuration is incomplete. Run the register-vapi-webhook.js script to set up all webhook configurations.');
  }
}

// Run the script
checkAllWebhookConfigurations();
