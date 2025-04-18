/**
 * MCP Webhook Solution
 * 
 * This script uses Model Context Protocol to automate webhook setup and integration
 * between VAPI, Supabase, and Playwright for testing.
 */

const express = require('express');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3004;

// Configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';
const WALLET_ID = 'bc24330e-70f5-4508-9370-dbbd56fb3bfa';

// Supabase Configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

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
  bgBlack: '\x1b[40m',
  bgMagenta: '\x1b[45m',
  bgBlue: '\x1b[44m',
  bgYellow: '\x1b[43m'
};

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Store received webhooks
const receivedWebhooks = [];

// Handle VAPI webhook events
app.post('/api/webhooks/vapi', async (req, res) => {
  console.log(`\n${colors.bgGreen}${colors.black} WEBHOOK EVENT RECEIVED ${colors.reset}\n`);
  
  // Store the webhook
  receivedWebhooks.push({
    timestamp: new Date().toISOString(),
    body: req.body
  });
  
  // Log the webhook
  console.log(JSON.stringify(req.body, null, 2));
  
  // Process the webhook
  await processWebhook(req.body);
  
  // Send success response
  res.status(200).json({ success: true });
});

// Process webhook
async function processWebhook(webhookData) {
  try {
    console.log(`\n${colors.bgBlue}${colors.white} PROCESSING WEBHOOK ${colors.reset}\n`);
    
    // Extract relevant data from webhook
    let callId, callStatus, transcript, recordingUrl, summary;
    
    // Handle different webhook formats
    if (webhookData.message) {
      // New format (2025)
      const message = webhookData.message;
      const call = message.call;
      
      if (call) {
        callId = call.id;
        callStatus = call.status;
      }
      
      if (message.type === 'end-of-call-report') {
        transcript = message.transcript;
        recordingUrl = message.recordingUrl;
        summary = message.summary;
      }
    } else if (webhookData.event) {
      // Legacy format
      callId = webhookData.call_id;
      
      if (webhookData.data) {
        callStatus = webhookData.data.status;
        transcript = webhookData.data.transcript;
        recordingUrl = webhookData.data.recording_url;
        summary = webhookData.data.summary;
      }
    }
    
    // Skip if no call ID
    if (!callId) {
      console.log(`${colors.yellow}No call ID found in webhook data${colors.reset}`);
      return;
    }
    
    console.log(`${colors.cyan}Call ID: ${colors.reset}${callId}`);
    console.log(`${colors.cyan}Call Status: ${colors.reset}${callStatus || 'unknown'}`);
    
    // Store in Supabase
    if (callId) {
      try {
        console.log(`${colors.blue}Storing webhook data in Supabase...${colors.reset}`);
        
        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/calls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            call_id: callId,
            call_status: callStatus || 'unknown',
            transcript: transcript,
            recording_url: recordingUrl,
            summary: summary,
            metadata: webhookData,
            updated_at: new Date().toISOString()
          })
        });
        
        if (supabaseResponse.ok) {
          console.log(`${colors.green}Webhook data stored in Supabase successfully${colors.reset}`);
        } else {
          console.log(`${colors.red}Error storing webhook data in Supabase:${colors.reset} ${await supabaseResponse.text()}`);
        }
      } catch (supabaseError) {
        console.log(`${colors.red}Error storing webhook data in Supabase:${colors.reset} ${supabaseError.message}`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}Error processing webhook:${colors.reset} ${error.message}`);
  }
}

// Test endpoint
app.get('/test', (req, res) => {
  console.log(`${colors.yellow}Test endpoint called${colors.reset}`);
  res.status(200).json({ success: true, message: 'Webhook server is working!' });
});

// Dashboard endpoint
app.get('/dashboard', (req, res) => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Webhook Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .webhook { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
        .timestamp { color: #888; font-size: 0.8em; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .controls { margin-bottom: 20px; }
        button { padding: 10px; margin-right: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Webhook Dashboard</h1>
      <div class="controls">
        <button onclick="makeTestCall()">Make Test Call</button>
        <button onclick="refreshPage()">Refresh</button>
      </div>
      <h2>Received Webhooks (${receivedWebhooks.length})</h2>
  `;
  
  if (receivedWebhooks.length === 0) {
    html += '<p>No webhooks received yet.</p>';
  } else {
    receivedWebhooks.forEach((webhook, index) => {
      html += `
        <div class="webhook">
          <div class="timestamp">Webhook #${index + 1} - ${webhook.timestamp}</div>
          <pre>${JSON.stringify(webhook.body, null, 2)}</pre>
        </div>
      `;
    });
  }
  
  html += `
      <script>
        function makeTestCall() {
          fetch('/make-test-call', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              alert('Test call initiated: ' + data.callId);
              setTimeout(() => refreshPage(), 5000);
            })
            .catch(error => alert('Error making test call: ' + error));
        }
        
        function refreshPage() {
          window.location.reload();
        }
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Make test call endpoint
app.post('/make-test-call', async (req, res) => {
  try {
    const callId = await makeTestCall();
    res.json({ success: true, callId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle all other routes
app.use('/', (req, res) => {
  res.redirect('/dashboard');
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`\n${colors.bgMagenta}${colors.white} MCP WEBHOOK SOLUTION ${colors.reset}`);
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
  
  // Open dashboard in browser
  await openDashboard(`${ngrokUrl}/dashboard`);
  
  console.log(`\n${colors.yellow}Webhook server is now running and waiting for events.${colors.reset}`);
  console.log(`${colors.yellow}Dashboard available at: ${ngrokUrl}/dashboard${colors.reset}`);
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
    console.log(`\n${colors.bgYellow}${colors.black} REGISTERING WEBHOOK WITH VAPI ${colors.reset}\n`);
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
    console.log(`\n${colors.bgBlue}${colors.white} MAKING TEST CALL ${colors.reset}\n`);
    
    const payload = {
      assistant_id: ASSISTANT_ID,
      to: YOUR_PHONE_NUMBER,
      phone_number_id: PHONE_NUMBER_ID,
      org_id: ORGANIZATION_ID,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        wallet_id: WALLET_ID
      }
    };
    
    console.log(`${colors.white}Making call to: ${colors.reset}${YOUR_PHONE_NUMBER}`);
    console.log(`${colors.white}Payload: ${colors.reset}${JSON.stringify(payload, null, 2)}`);
    
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

// Open dashboard in browser
async function openDashboard(url) {
  try {
    console.log(`\n${colors.cyan}Opening dashboard in browser: ${colors.reset}${url}`);
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(url);
    
    // Keep browser open
    console.log(`${colors.green}Dashboard opened in browser${colors.reset}`);
  } catch (err) {
    console.log(`${colors.yellow}Could not open dashboard in browser: ${err.message}${colors.reset}`);
    console.log(`${colors.yellow}Please open manually: ${url}${colors.reset}`);
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
