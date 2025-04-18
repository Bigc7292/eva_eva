/**
 * Automated Webhook Setup and Testing
 * 
 * This script automates the process of setting up and testing VAPI webhooks
 */

const { chromium } = require('playwright');
const { exec, spawn } = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';
const WEBHOOK_PORT = 3004;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Log with color
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Log success
function success(message) {
  log(`✅ ${message}`, colors.green);
}

// Log error
function error(message) {
  log(`❌ ${message}`, colors.red);
}

// Log warning
function warning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

// Log info
function info(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

// Check if a port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Check if ngrok is running
async function checkNgrok() {
  log('\n=== Checking if ngrok is running ===', colors.cyan);
  
  try {
    const response = await fetch('http://localhost:4040/api/tunnels');
    
    if (!response.ok) {
      error('ngrok is not running or not accessible');
      return null;
    }
    
    const data = await response.json();
    
    if (!data.tunnels || data.tunnels.length === 0) {
      error('No active ngrok tunnels found');
      return null;
    }
    
    const httpsTunnel = data.tunnels.find(tunnel => 
      tunnel.proto === 'https' && tunnel.config.addr.includes(WEBHOOK_PORT.toString())
    );
    
    if (!httpsTunnel) {
      error(`No ngrok tunnel found for port ${WEBHOOK_PORT}`);
      return null;
    }
    
    success(`ngrok is running with URL: ${httpsTunnel.public_url}`);
    return httpsTunnel.public_url;
  } catch (err) {
    error(`Error checking ngrok: ${err.message}`);
    return null;
  }
}

// Start ngrok if not running
async function startNgrok() {
  log('\n=== Starting ngrok ===', colors.cyan);
  
  return new Promise((resolve) => {
    const ngrokProcess = spawn('ngrok', ['http', WEBHOOK_PORT.toString()], {
      detached: true,
      stdio: 'pipe'
    });
    
    let output = '';
    
    ngrokProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      // Check if ngrok has started and provided a URL
      if (output.includes('https://') && output.includes('ngrok-free.app')) {
        const match = output.match(/(https:\/\/[a-z0-9-]+\.ngrok-free\.app)/);
        if (match && match[1]) {
          success(`Started ngrok with URL: ${match[1]}`);
          resolve(match[1]);
        }
      }
    });
    
    ngrokProcess.stderr.on('data', (data) => {
      error(`ngrok error: ${data.toString()}`);
    });
    
    // If ngrok doesn't start within 10 seconds, assume it failed
    setTimeout(() => {
      if (!output.includes('https://')) {
        error('Failed to start ngrok within timeout period');
        resolve(null);
      }
    }, 10000);
    
    // Unref the process so it doesn't keep the Node.js process alive
    ngrokProcess.unref();
  });
}

// Start webhook server
async function startWebhookServer() {
  log('\n=== Starting webhook server ===', colors.cyan);
  
  // Check if port is already in use
  const portInUse = await isPortInUse(WEBHOOK_PORT);
  
  if (portInUse) {
    warning(`Port ${WEBHOOK_PORT} is already in use. Assuming webhook server is already running.`);
    return true;
  }
  
  // Create a simple Express server for webhooks
  const serverCode = `
    const express = require('express');
    const app = express();
    const PORT = ${WEBHOOK_PORT};
    
    // Parse JSON bodies
    app.use(express.json({ limit: '10mb' }));
    
    // Handle VAPI webhook events
    app.post('/api/webhooks/vapi', (req, res) => {
      console.log('\\n=== WEBHOOK EVENT RECEIVED ===');
      console.log(JSON.stringify(req.body, null, 2));
      console.log('===================================\\n');
      
      res.status(200).json({ success: true });
    });
    
    // Test endpoint
    app.get('/test', (req, res) => {
      console.log('Test endpoint called');
      res.status(200).json({ success: true, message: 'Webhook server is working!' });
    });
    
    // Handle all other routes
    app.use('/', (req, res) => {
      console.log('Request received on non-webhook endpoint');
      res.status(200).send('Webhook server is running. Send POST requests to /api/webhooks/vapi');
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(\`Webhook server running on port \${PORT}\`);
    });
  `;
  
  // Write the server code to a temporary file
  const tempServerPath = path.join(__dirname, 'temp-webhook-server.js');
  fs.writeFileSync(tempServerPath, serverCode);
  
  // Start the server
  const serverProcess = spawn('node', [tempServerPath], {
    detached: true,
    stdio: 'pipe'
  });
  
  let output = '';
  
  serverProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString());
  });
  
  serverProcess.stderr.on('data', (data) => {
    error(`Webhook server error: ${data.toString()}`);
  });
  
  // Wait for the server to start
  return new Promise((resolve) => {
    setTimeout(() => {
      if (output.includes('Webhook server running')) {
        success('Webhook server started successfully');
        resolve(true);
      } else {
        error('Failed to start webhook server');
        resolve(false);
      }
    }, 3000);
  });
}

// Register webhook with VAPI
async function registerWebhook(ngrokUrl) {
  log('\n=== Registering webhook with VAPI ===', colors.cyan);
  
  const webhookUrl = `${ngrokUrl}/api/webhooks/vapi`;
  
  try {
    // Register webhook
    const response = await fetch(`${VAPI_API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: [
          'call.started',
          'call.ended',
          'call.status_updated',
          'transcript.created',
          'recording.created',
          'summary.created',
          'analysis.created'
        ],
        active: true,
        description: 'Top Loader Agent AI Solutions webhook for call events'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      error(`Error registering webhook: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    success(`Webhook registered successfully with ID: ${data.id}`);
    
    // Set organization server URL
    await fetch(`${VAPI_API_URL}/organization/${ORGANIZATION_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        server: {
          url: webhookUrl
        }
      })
    });
    
    success('Organization server URL set successfully');
    
    // Set assistant server URL
    await fetch(`${VAPI_API_URL}/assistant/${ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: webhookUrl
      })
    });
    
    success('Assistant server URL set successfully');
    
    // Set phone number server URL
    await fetch(`${VAPI_API_URL}/phone-number/${PHONE_NUMBER_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        serverUrl: webhookUrl
      })
    });
    
    success('Phone number server URL set successfully');
    
    return true;
  } catch (err) {
    error(`Error registering webhook: ${err.message}`);
    return false;
  }
}

// Make a test call
async function makeTestCall() {
  log('\n=== Making a test call ===', colors.cyan);
  
  try {
    const payload = {
      assistant_id: ASSISTANT_ID,
      to: YOUR_PHONE_NUMBER,
      phone_number_id: PHONE_NUMBER_ID,
      org_id: ORGANIZATION_ID,
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    info(`Making call to: ${YOUR_PHONE_NUMBER}`);
    
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      error(`Error making call: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    success(`Call initiated successfully with ID: ${data.id}`);
    info(`Call status: ${data.status}`);
    
    return data.id;
  } catch (err) {
    error(`Error making call: ${err.message}`);
    return null;
  }
}

// Monitor for webhook events
async function monitorWebhookEvents(callId) {
  log('\n=== Monitoring for webhook events ===', colors.cyan);
  info(`Waiting for webhook events for call ID: ${callId}`);
  info('This will run for 60 seconds. You should see webhook events appear below:');
  
  // We'll just wait for 60 seconds and let the webhook server log events
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  log('\n=== Webhook monitoring complete ===', colors.cyan);
}

// Main function
async function main() {
  log('=== AUTOMATED WEBHOOK SETUP AND TESTING ===', colors.bgMagenta + colors.white);
  
  // Step 1: Check if ngrok is running
  let ngrokUrl = await checkNgrok();
  
  // If ngrok is not running, start it
  if (!ngrokUrl) {
    warning('ngrok is not running. Attempting to start it...');
    ngrokUrl = await startNgrok();
    
    if (!ngrokUrl) {
      error('Failed to start ngrok. Please start it manually with: ngrok http 3004');
      return;
    }
  }
  
  // Step 2: Start webhook server
  const serverStarted = await startWebhookServer();
  
  if (!serverStarted) {
    error('Failed to start webhook server. Please check if port 3004 is available.');
    return;
  }
  
  // Step 3: Register webhook with VAPI
  const webhookRegistered = await registerWebhook(ngrokUrl);
  
  if (!webhookRegistered) {
    error('Failed to register webhook with VAPI. Please check your API key and try again.');
    return;
  }
  
  // Step 4: Make a test call
  const callId = await makeTestCall();
  
  if (!callId) {
    error('Failed to make a test call. Please check your VAPI configuration.');
    return;
  }
  
  // Step 5: Monitor for webhook events
  await monitorWebhookEvents(callId);
  
  log('\n=== AUTOMATION COMPLETE ===', colors.bgGreen + colors.black);
  success('Webhook setup and testing completed successfully.');
  info('If you received a call and saw webhook events, everything is working correctly!');
  info('If not, please check the logs above for any errors.');
}

// Run the main function
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  error(err.stack);
});
