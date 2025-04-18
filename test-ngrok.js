/**
 * Test ngrok Forwarding
 * 
 * This script tests if ngrok is properly forwarding requests to your webhook server
 */

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const NGROK_URL = 'https://252c-91-73-200-83.ngrok-free.app';
const LOCAL_URL = 'http://localhost:3004';

// Test data
const testPayload = {
  message: {
    type: 'status-update',
    call: {
      id: 'test-call-' + Date.now(),
      status: 'testing',
      orgId: '8ddf2438-8b84-42c2-973c-4b7a69272a99'
    }
  }
};

/**
 * Test the local webhook server
 */
async function testLocalServer() {
  try {
    console.log('Testing local webhook server...');
    
    // First test the /test endpoint
    const testResponse = await fetch(`${LOCAL_URL}/test`);
    
    if (!testResponse.ok) {
      console.error(`Local server test endpoint failed: ${testResponse.status}`);
      return false;
    }
    
    const testData = await testResponse.json();
    console.log('Local server test endpoint response:', testData);
    
    // Now test the webhook endpoint
    const webhookResponse = await fetch(`${LOCAL_URL}/api/webhooks/vapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    if (!webhookResponse.ok) {
      console.error(`Local server webhook endpoint failed: ${webhookResponse.status}`);
      return false;
    }
    
    const webhookData = await webhookResponse.json();
    console.log('Local server webhook endpoint response:', webhookData);
    
    return true;
  } catch (error) {
    console.error('Error testing local server:', error);
    return false;
  }
}

/**
 * Test the ngrok forwarding
 */
async function testNgrokForwarding() {
  try {
    console.log('\nTesting ngrok forwarding...');
    
    // First test the /test endpoint
    const testResponse = await fetch(`${NGROK_URL}/test`);
    
    if (!testResponse.ok) {
      console.error(`ngrok forwarding test endpoint failed: ${testResponse.status}`);
      return false;
    }
    
    const testData = await testResponse.json();
    console.log('ngrok forwarding test endpoint response:', testData);
    
    // Now test the webhook endpoint
    const webhookResponse = await fetch(`${NGROK_URL}/api/webhooks/vapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    if (!webhookResponse.ok) {
      console.error(`ngrok forwarding webhook endpoint failed: ${webhookResponse.status}`);
      return false;
    }
    
    const webhookData = await webhookResponse.json();
    console.log('ngrok forwarding webhook endpoint response:', webhookData);
    
    return true;
  } catch (error) {
    console.error('Error testing ngrok forwarding:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting ngrok forwarding tests...');
  
  // Test local server
  const localServerWorking = await testLocalServer();
  console.log(`\nLocal server working: ${localServerWorking ? 'YES' : 'NO'}`);
  
  // Test ngrok forwarding
  const ngrokForwardingWorking = await testNgrokForwarding();
  console.log(`\nngrok forwarding working: ${ngrokForwardingWorking ? 'YES' : 'NO'}`);
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  if (localServerWorking && ngrokForwardingWorking) {
    console.log('✅ Everything is working correctly!');
    console.log('Your webhook server is running and ngrok is properly forwarding requests.');
  } else if (localServerWorking && !ngrokForwardingWorking) {
    console.log('❌ Local server is working but ngrok forwarding is NOT working.');
    console.log('Possible issues:');
    console.log('1. ngrok is not running');
    console.log('2. ngrok is not forwarding to port 3004');
    console.log('3. The ngrok URL is incorrect');
    console.log('4. There are network/firewall issues');
  } else if (!localServerWorking && ngrokForwardingWorking) {
    console.log('❓ Strange situation: ngrok forwarding is working but local server is NOT working.');
    console.log('This is unexpected - check if the local server is running on the correct port.');
  } else {
    console.log('❌ Both local server and ngrok forwarding are NOT working.');
    console.log('Make sure your webhook server is running on port 3004 and ngrok is properly configured.');
  }
}

// Run the tests
runTests();
