/**
 * Webhook Setup using MCP
 * 
 * This script uses the Model Context Protocol to set up and test VAPI webhooks
 */

const express = require('express');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const app = express();
const PORT = 3004;

// VAPI Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgBlack: '\x1b[40m'
};

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Handle VAPI webhook events
app.post('/api/webhooks/vapi', (req, res) => {
  console.log(`\n${colors.bgGreen}${colors.black} WEBHOOK EVENT RECEIVED ${colors.reset}\n`);
  console.log(JSON.stringify(req.body, null, 2));
  console.log('\n=======================================\n');
  
  res.status(200).json({ success: true });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log(`${colors.yellow}Test endpoint called${colors.reset}`);
  res.status(200).json({ success: true, message: 'Webhook server is working!' });
});

// Handle all other routes
app.use('/', (req, res) => {
  console.log(`${colors.blue}Request received on non-webhook endpoint${colors.reset}`);
  res.status(200).send('Webhook server is running. Send POST requests to /api/webhooks/vapi');
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`\n${colors.bgGreen}${colors.black} WEBHOOK SERVER STARTED ${colors.reset}`);
  console.log(`${colors.white}Server running on port ${colors.bright}${PORT}${colors.reset}`);
  
  // Get ngrok URL
  const ngrokUrl = await getOrStartNgrok();
  
  if (!ngrokUrl) {
    console.log(`${colors.red}Failed to get ngrok URL. Please start ngrok manually with: ngrok http ${PORT}${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}ngrok URL: ${colors.reset}${ngrokUrl}`);
  
  // Register webhook with VAPI
  await registerWebhook(`${ngrokUrl}/api/webhooks/vapi`);
  
  // Make a test call
  await makeTestCall();
  
  console.log(`\n${colors.yellow}Webhook server is now running and waiting for events.${colors.reset}`);
  console.log(`${colors.yellow}Press Ctrl+C to stop the server.${colors.reset}`);
});

// Get or start ngrok
async function getOrStartNgrok() {
  try {
    // Check if ngrok is already running
    const response = await fetch('http://localhost:4040/api/tunnels');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.tunnels && data.tunnels.length > 0) {
        const httpsTunnel = data.tunnels.find(tunnel => tunnel.proto === 'https');
        
        if (httpsTunnel) {
          console.log(`${colors.green}ngrok is already running${colors.reset}`);
          return httpsTunnel.public_url;
        }
      }
    }
  } catch (err) {
    console.log(`${colors.yellow}ngrok is not running. Attempting to start it...${colors.reset}`);
  }
  
  // Start ngrok
  return new Promise((resolve) => {
    const ngrokProcess = spawn('ngrok', ['http', PORT.toString()], {
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
          console.log(`${colors.green}Started ngrok with URL: ${colors.reset}${match[1]}`);
          resolve(match[1]);
        }
      }
    });
    
    ngrokProcess.stderr.on('data', (data) => {
      console.log(`${colors.red}ngrok error: ${colors.reset}${data.toString()}`);
    });
    
    // If ngrok doesn't start within 10 seconds, assume it failed
    setTimeout(() => {
      if (!output.includes('https://')) {
        console.log(`${colors.red}Failed to start ngrok within timeout period${colors.reset}`);
        resolve(null);
      }
    }, 10000);
    
    // Unref the process so it doesn't keep the Node.js process alive
    ngrokProcess.unref();
  });
}

// Register webhook with VAPI
async function registerWebhook(webhookUrl) {
  try {
    console.log(`\n${colors.cyan}Registering webhook with VAPI...${colors.reset}`);
    console.log(`${colors.white}Webhook URL: ${colors.reset}${webhookUrl}`);
    
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
      console.log(`${colors.red}Error registering webhook: ${response.status} - ${errorText}${colors.reset}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`${colors.green}Webhook registered successfully with ID: ${colors.reset}${data.id}`);
    
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
    
    console.log(`${colors.green}Organization server URL set successfully${colors.reset}`);
    
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
    
    console.log(`${colors.green}Assistant server URL set successfully${colors.reset}`);
    
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
    
    console.log(`${colors.green}Phone number server URL set successfully${colors.reset}`);
    
    return true;
  } catch (err) {
    console.log(`${colors.red}Error registering webhook: ${err.message}${colors.reset}`);
    return false;
  }
}

// Make a test call
async function makeTestCall() {
  try {
    console.log(`\n${colors.cyan}Making a test call...${colors.reset}`);
    
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
    
    console.log(`${colors.white}Making call to: ${colors.reset}${YOUR_PHONE_NUMBER}`);
    
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
      console.log(`${colors.red}Error making call: ${response.status} - ${errorText}${colors.reset}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`${colors.green}Call initiated successfully with ID: ${colors.reset}${data.id}`);
    console.log(`${colors.white}Call status: ${colors.reset}${data.status}`);
    
    return data.id;
  } catch (err) {
    console.log(`${colors.red}Error making call: ${err.message}${colors.reset}`);
    return null;
  }
}

// Handle server shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down webhook server...${colors.reset}`);
  server.close(() => {
    console.log(`${colors.green}Webhook server stopped${colors.reset}`);
    process.exit(0);
  });
});
