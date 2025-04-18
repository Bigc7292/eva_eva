/**
 * Simple Webhook Server
 * 
 * A minimal webhook server for VAPI that doesn't require many dependencies
 */

const express = require('express');
const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const app = express();
const PORT = 3004;

// VAPI Configuration
const VAPI_API_URL = 'api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';
const WALLET_ID = 'bc24330e-70f5-4508-9370-dbbd56fb3bfa';

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
app.post('/api/webhooks/vapi', (req, res) => {
  console.log(`\n${colors.bgGreen}${colors.black} WEBHOOK EVENT RECEIVED ${colors.reset}\n`);
  
  // Store the webhook
  receivedWebhooks.push({
    timestamp: new Date().toISOString(),
    body: req.body
  });
  
  // Log the webhook
  console.log(JSON.stringify(req.body, null, 2));
  
  // Send success response
  res.status(200).json({ success: true });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log(`${colors.yellow}Test endpoint called${colors.reset}`);
  res.status(200).json({ success: true, message: 'Webhook server is working!' });
});

// Dashboard endpoint
app.get('/', (req, res) => {
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
app.post('/make-test-call', (req, res) => {
  makeTestCall()
    .then(callId => {
      res.json({ success: true, callId });
    })
    .catch(error => {
      res.status(500).json({ success: false, error: error.message });
    });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`\n${colors.bgMagenta}${colors.white} SIMPLE WEBHOOK SERVER ${colors.reset}`);
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
  
  console.log(`\n${colors.yellow}Webhook server is now running and waiting for events.${colors.reset}`);
  console.log(`${colors.yellow}Dashboard available at: ${ngrokUrl}${colors.reset}`);
  console.log(`${colors.yellow}Press Ctrl+C to stop the server.${colors.reset}`);
});

// Get or start ngrok
async function getOrStartNgrok() {
  try {
    // Check if ngrok is already running
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 4040,
        path: '/api/tunnels',
        method: 'GET'
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const tunnels = JSON.parse(data).tunnels;
              
              if (tunnels && tunnels.length > 0) {
                const httpsTunnel = tunnels.find(tunnel => tunnel.proto === 'https');
                
                if (httpsTunnel) {
                  console.log(`${colors.green}ngrok is already running${colors.reset}`);
                  resolve(httpsTunnel.public_url);
                  return;
                }
              }
              
              console.log(`${colors.yellow}No HTTPS tunnels found in ngrok${colors.reset}`);
              resolve(null);
            } catch (err) {
              console.log(`${colors.red}Error parsing ngrok response:${colors.reset} ${err.message}`);
              resolve(null);
            }
          } else {
            console.log(`${colors.red}Error checking ngrok:${colors.reset} ${res.statusCode}`);
            resolve(null);
          }
        });
      });
      
      req.on('error', (err) => {
        console.log(`${colors.yellow}ngrok is not running. Attempting to start it...${colors.reset}`);
        resolve(null);
      });
      
      req.end();
    });
  } catch (err) {
    console.log(`${colors.yellow}Error checking ngrok:${colors.reset} ${err.message}`);
    console.log(`${colors.yellow}Attempting to start ngrok...${colors.reset}`);
    return null;
  }
}

// Register webhook with VAPI
async function registerWebhook(webhookUrl) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.bgYellow}${colors.black} REGISTERING WEBHOOK WITH VAPI ${colors.reset}\n`);
    console.log(`${colors.white}Webhook URL: ${colors.reset}${webhookUrl}`);
    
    // Register webhook
    const webhookData = JSON.stringify({
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
    });
    
    const options = {
      hostname: VAPI_API_URL,
      port: 443,
      path: '/webhooks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(webhookData),
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const responseData = JSON.parse(data);
            console.log(`${colors.green}Webhook registered successfully with ID: ${colors.reset}${responseData.id}`);
            
            // Set organization server URL
            setOrganizationServerUrl(webhookUrl)
              .then(() => setAssistantServerUrl(webhookUrl))
              .then(() => setPhoneNumberServerUrl(webhookUrl))
              .then(() => resolve(true))
              .catch(err => {
                console.log(`${colors.yellow}Error setting server URLs:${colors.reset} ${err.message}`);
                resolve(true); // Still consider it a success if webhook was registered
              });
          } catch (err) {
            console.log(`${colors.red}Error parsing webhook response:${colors.reset} ${err.message}`);
            resolve(false);
          }
        } else {
          console.log(`${colors.red}Error registering webhook:${colors.reset} ${res.statusCode} - ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`${colors.red}Error registering webhook:${colors.reset} ${err.message}`);
      resolve(false);
    });
    
    req.write(webhookData);
    req.end();
  });
}

// Set organization server URL
function setOrganizationServerUrl(webhookUrl) {
  return new Promise((resolve, reject) => {
    const orgData = JSON.stringify({
      server: {
        url: webhookUrl
      }
    });
    
    const options = {
      hostname: VAPI_API_URL,
      port: 443,
      path: `/organization/${ORGANIZATION_ID}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(orgData),
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${colors.green}Organization server URL set successfully${colors.reset}`);
          resolve(true);
        } else {
          console.log(`${colors.red}Error setting organization server URL:${colors.reset} ${res.statusCode} - ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`${colors.red}Error setting organization server URL:${colors.reset} ${err.message}`);
      resolve(false);
    });
    
    req.write(orgData);
    req.end();
  });
}

// Set assistant server URL
function setAssistantServerUrl(webhookUrl) {
  return new Promise((resolve, reject) => {
    const assistantData = JSON.stringify({
      serverUrl: webhookUrl
    });
    
    const options = {
      hostname: VAPI_API_URL,
      port: 443,
      path: `/assistant/${ASSISTANT_ID}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(assistantData),
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${colors.green}Assistant server URL set successfully${colors.reset}`);
          resolve(true);
        } else {
          console.log(`${colors.red}Error setting assistant server URL:${colors.reset} ${res.statusCode} - ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`${colors.red}Error setting assistant server URL:${colors.reset} ${err.message}`);
      resolve(false);
    });
    
    req.write(assistantData);
    req.end();
  });
}

// Set phone number server URL
function setPhoneNumberServerUrl(webhookUrl) {
  return new Promise((resolve, reject) => {
    const phoneData = JSON.stringify({
      serverUrl: webhookUrl
    });
    
    const options = {
      hostname: VAPI_API_URL,
      port: 443,
      path: `/phone-number/${PHONE_NUMBER_ID}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(phoneData),
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${colors.green}Phone number server URL set successfully${colors.reset}`);
          resolve(true);
        } else {
          console.log(`${colors.red}Error setting phone number server URL:${colors.reset} ${res.statusCode} - ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`${colors.red}Error setting phone number server URL:${colors.reset} ${err.message}`);
      resolve(false);
    });
    
    req.write(phoneData);
    req.end();
  });
}

// Make a test call
function makeTestCall() {
  return new Promise((resolve, reject) => {
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
    
    const callData = JSON.stringify(payload);
    
    console.log(`${colors.white}Making call to: ${colors.reset}${YOUR_PHONE_NUMBER}`);
    
    const options = {
      hostname: VAPI_API_URL,
      port: 443,
      path: '/call',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(callData),
        'Authorization': `Bearer ${PRIVATE_API_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const responseData = JSON.parse(data);
            console.log(`${colors.green}Call initiated successfully with ID: ${colors.reset}${responseData.id}`);
            console.log(`${colors.white}Call status: ${colors.reset}${responseData.status}`);
            resolve(responseData.id);
          } catch (err) {
            console.log(`${colors.red}Error parsing call response:${colors.reset} ${err.message}`);
            reject(new Error(`Error parsing call response: ${err.message}`));
          }
        } else {
          console.log(`${colors.red}Error making call:${colors.reset} ${res.statusCode} - ${data}`);
          reject(new Error(`Error making call: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`${colors.red}Error making call:${colors.reset} ${err.message}`);
      reject(err);
    });
    
    req.write(callData);
    req.end();
  });
}

// Handle server shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down webhook server...${colors.reset}`);
  server.close(() => {
    console.log(`${colors.green}Webhook server stopped${colors.reset}`);
    process.exit(0);
  });
});
