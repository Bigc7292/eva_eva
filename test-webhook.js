/**
 * Test Webhook Script
 * 
 * This script sends a test webhook event to the webhook monitor
 */

const fetch = require('node-fetch');

// Configuration
const WEBHOOK_URL = 'http://localhost:3004/api/webhooks/vapi';
const NGROK_URL = 'https://252c-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

// Test data - simulates a VAPI webhook event
const testEvent = {
  event: 'call.started',
  call_id: 'test-call-123',
  timestamp: new Date().toISOString(),
  data: {
    customer: {
      number: '+971565401583'
    },
    status: 'in-progress',
    assistant_id: 'cfaa163c-4a47-471b-a39e-95c12d0cb738'
  }
};

// Function to test the local webhook endpoint
async function testLocalWebhook() {
  try {
    console.log('Testing local webhook endpoint...');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEvent)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Local webhook test successful!');
    console.log('Response:', data);
  } catch (error) {
    console.error('Error testing local webhook:', error);
  }
}

// Function to test the ngrok webhook endpoint
async function testNgrokWebhook() {
  try {
    console.log('Testing ngrok webhook endpoint...');
    
    const response = await fetch(NGROK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEvent)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Ngrok webhook test successful!');
    console.log('Response:', data);
  } catch (error) {
    console.error('Error testing ngrok webhook:', error);
  }
}

// Run the tests
async function runTests() {
  // First test the local endpoint
  await testLocalWebhook();
  
  // Then test the ngrok endpoint
  await testNgrokWebhook();
}

runTests();
