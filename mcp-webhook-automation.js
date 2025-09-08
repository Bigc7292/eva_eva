/**
 * MCP Webhook Automation
 * 
 * This script uses Model Context Protocol to automate the setup and testing of VAPI webhooks
 */

const express = require('express');
const { spawn } = require('child_process');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const PORT = 3004;
const VAPI_API_URL = 'https://api.vapi.ai';
const PRIVATE_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
const ORGANIZATION_ID = '8ddf2438-8b84-42c2-973c-4b7a69272a99';
const ASSISTANT_ID = 'cfaa163c-4a47-471b-a39e-95c12d0cb738';
const PHONE_NUMBER_ID = 'e65a9e6b-33b7-4711-ad21-90220048e38f';
const YOUR_PHONE_NUMBER = '+971565401583';
const WALLET_ID = 'bc24330e-70f5-4508-9370-dbbd56fb3bfa';

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// MCP configuration
const MCP_CONFIG = {
  serverUrl: 'https://actions.zapier.com/mcp/sk-ak-dBnpbjLVCQX3oMnuHruLvJiX0a/sse',
  database: {
    host: 'stexfwbuwyyfmkmxcftv.supabase.co',
    port: 5432,
    user: 'postgres',
    database: 'postgres',
    schema: 'public'
  }
};

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

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create Express app
const app = express();

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Handle VAPI webhook events
app.post('/api/webhooks/vapi', async (req, res) => {
  console.log(`\n${colors.bgGreen}${colors.black} WEBHOOK EVENT RECEIVED ${colors.reset}\n`);
  
  try {
    // Log the webhook event
    console.log(JSON.stringify(req.body, null, 2));
    
    // Process the webhook event using MCP
    await processWebhookWithMCP(req.body);
    
    // Send success response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`${colors.red}Error processing webhook:${colors.reset}`, error);
    res.status(200).json({ success: true }); // Still return 200 to acknowledge receipt
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log(`${colors.yellow}Test endpoint called${colors.reset}`);
  res.status(200).json({ success: true, message: 'MCP Webhook server is working!' });
});

// Handle all other routes
app.use('/', (req, res) => {
  console.log(`${colors.blue}Request received on non-webhook endpoint${colors.reset}`);
  res.status(200).send('MCP Webhook server is running. Send POST requests to /api/webhooks/vapi');
});

// Process webhook event with MCP
async function processWebhookWithMCP(webhookData) {
  try {
    // Check if this is a message-type webhook
    if (webhookData.message) {
      const messageType = webhookData.message.type;
      const call = webhookData.message.call;
      
      console.log(`${colors.magenta}Message Type:${colors.reset} ${messageType}`);
      
      // Robustly extract callId from all likely locations
      let callId = undefined;
      let callObj = undefined;
      if (webhookData.message && webhookData.message.call && webhookData.message.call.id) {
        callObj = webhookData.message.call;
        callId = callObj.id;
      } else if (webhookData.call_id) {
        callId = webhookData.call_id;
        callObj = webhookData.call || {};
      } else if (webhookData.message && webhookData.message.call_id) {
        callId = webhookData.message.call_id;
        callObj = webhookData.message.call || {};
      } else if (webhookData.call && webhookData.call.id) {
        callObj = webhookData.call;
        callId = callObj.id;
      }
      if (callId) {
        console.log(`${colors.blue}Call ID:${colors.reset} ${callId}`);
        console.log(`${colors.blue}Call Status:${colors.reset} ${callObj && callObj.status ? callObj.status : 'unknown'}`);
        await storeCallData(callObj, messageType, webhookData.message);
      } else {
        console.warn(`${colors.yellow}No valid call ID found in webhook payload. Full payload:`, JSON.stringify(webhookData));
      }
      
      // Handle different message types
      switch (messageType) {
        case 'status-update':
          await handleStatusUpdate(webhookData.message);
          break;
          
        case 'end-of-call-report':
          await handleEndOfCallReport(webhookData.message);
          break;
          
        case 'function-call':
          // Handle function calls if needed
          break;
          
        case 'hang':
          // Handle hang notifications if needed
          break;
      }
    } else if (webhookData.event) {
      // Legacy format
      const eventType = webhookData.event;
      const callId = webhookData.call_id;
      
      console.log(`${colors.magenta}Event Type:${colors.reset} ${eventType}`);
      console.log(`${colors.blue}Call ID:${colors.reset} ${callId || 'unknown'}`);
      
      // Store call data in Supabase
      if (callId) {
        await storeCallDataLegacy(callId, eventType, webhookData.data);
      } else {
        console.warn(`${colors.yellow}No valid call_id in legacy webhook payload. Payload:`, JSON.stringify(webhookData));
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error processing webhook with MCP:${colors.reset}`, error);
  }
}

// Store call data in Supabase
async function storeCallData(call, messageType, message) {
  try {
    // Check if call exists in database
    const { data: existingCall } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', call.id)
      .single();
    
    if (existingCall) {
      // Update existing call
      const updateData = {
        call_status: call.status,
        updated_at: new Date().toISOString()
      };
      
      // Add additional data based on message type
      if (messageType === 'end-of-call-report') {
        if (message.recordingUrl) updateData.recording_url = message.recordingUrl;
        if (message.transcript) updateData.transcript = message.transcript;
        if (message.summary) updateData.summary = message.summary;
        updateData.end_time = new Date().toISOString();
        updateData.call_duration = call.duration;
      }
      
      await supabase
        .from('calls')
        .update(updateData)
        .eq('call_id', call.id);
      
      console.log(`${colors.green}Updated call data in Supabase${colors.reset}`);
    
      // --- Update lead_profiles table for metrics ---
      await updateLeadProfileAfterCall(call);
    } else {
      // Insert new call
      const newCall = {
        call_id: call.id,
        phone_number: call.customer?.number || 'Unknown',
        call_type: call.type === 'outboundPhoneCall' ? 'Outbound' : 'Inbound',
        call_status: call.status,
        start_time: new Date().toISOString(),
        metadata: call,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await supabase
        .from('calls')
        .insert([newCall]);
      
      console.log(`${colors.green}Inserted new call data in Supabase${colors.reset}`);
      
      // Check if lead exists
      if (call.customer?.number) {
        const { data: existingLead } = await supabase
          .from('leads')
          .select('*')
          .eq('phone', call.customer.number)
          .single();
        
        if (!existingLead) {
          // Create new lead
          const newLead = {
            phone: call.customer.number,
            first_contact_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await supabase
            .from('leads')
            .insert([newLead]);
          
          console.log(`${colors.green}Created new lead in Supabase${colors.reset}`);
        }
      }
    }
    // --- Always update lead_profiles after inserting a new call ---
    await updateLeadProfileAfterCall(call);
  } catch (error) {
    console.error(`${colors.red}Error storing call data:${colors.reset}`, error);
  }
}

// Update or create lead_profiles record after a call
async function updateLeadProfileAfterCall(call) {
  try {
    if (!call.customer || !call.customer.number) return;
    const phone = call.customer.number;
    // Find the lead record
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .single();
    if (!lead) return;
    // Find lead_profile
    const { data: profile } = await supabase
      .from('lead_profiles')
      .select('*')
      .eq('phone', phone)
      .single();
    const now = new Date().toISOString();
    if (profile) {
      // Update stats
      let total_calls = (profile.total_calls || 0) + 1;
      let answered_calls = profile.answered_calls || 0;
      let missed_calls = profile.missed_calls || 0;
      let last_call_status = call.status || null;
      if (call.status === 'completed') answered_calls++;
      if (call.status === 'missed') missed_calls++;
      await supabase
        .from('lead_profiles')
        .update({
          total_calls,
          answered_calls,
          missed_calls,
          last_call_date: now,
          last_call_status,
          updated_at: now
        })
        .eq('id', profile.id);
    } else {
      // Create new profile
      await supabase
        .from('lead_profiles')
        .insert([{
          lead_id: lead.id,
          phone,
          first_contact_date: now,
          total_calls: 1,
          answered_calls: call.status === 'completed' ? 1 : 0,
          missed_calls: call.status === 'missed' ? 1 : 0,
          last_call_date: now,
          last_call_status: call.status || null,
          created_at: now,
          updated_at: now
        }]);
    }
  } catch (err) {
    console.error('Error updating lead_profiles after call:', err);
  }
}

// Store call data in Supabase (legacy format)
async function storeCallDataLegacy(callId, eventType, data) {
  try {
    // Check if call exists in database
    const { data: existingCall } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', callId)
      .single();
    
    if (existingCall) {
      // Update existing call
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      // Add additional data based on event type
      switch (eventType) {
        case 'call.ended':
          updateData.call_status = 'Completed';
          updateData.end_time = new Date().toISOString();
          if (data?.duration) updateData.call_duration = data.duration;
          if (data?.recording_url) updateData.recording_url = data.recording_url;
          break;
          
        case 'transcript.created':
          if (data?.transcript) updateData.transcript = data.transcript;
          break;
          
        case 'summary.created':
          if (data?.summary) updateData.summary = data.summary;
          break;
          
        case 'call.status_updated':
          if (data?.status) updateData.call_status = data.status;
          break;
      }
      
      await supabase
        .from('calls')
        .update(updateData)
        .eq('call_id', callId);
      
      console.log(`${colors.green}Updated call data in Supabase (legacy format)${colors.reset}`);
    } else if (eventType === 'call.started') {
      // Insert new call
      const newCall = {
        call_id: callId,
        phone_number: data?.to || 'Unknown',
        call_type: data?.direction === 'inbound' ? 'Inbound' : 'Outbound',
        call_status: 'Started',
        start_time: new Date().toISOString(),
        metadata: data || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await supabase
        .from('calls')
        .insert([newCall]);
      
      console.log(`${colors.green}Inserted new call data in Supabase (legacy format)${colors.reset}`);
      
      // Check if lead exists
      if (data?.to) {
        const { data: existingLead } = await supabase
          .from('leads')
          .select('*')
          .eq('phone', data.to)
          .single();
        
        if (!existingLead) {
          // Create new lead
          const newLead = {
            phone: data.to,
            first_contact_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          await supabase
            .from('leads')
            .insert([newLead]);
          
          console.log(`${colors.green}Created new lead in Supabase (legacy format)${colors.reset}`);
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error storing call data (legacy format):${colors.reset}`, error);
  }
}

// Handle status update
async function handleStatusUpdate(message) {
  console.log(`${colors.yellow}Status Update:${colors.reset} ${message.status || 'unknown'}`);
  // Additional processing if needed
}

// Handle end of call report
async function handleEndOfCallReport(message) {
  console.log(`${colors.green}End of Call Report${colors.reset}`);
  
  if (message.endedReason) {
    console.log(`${colors.yellow}Ended Reason:${colors.reset} ${message.endedReason}`);
  }
  
  if (message.recordingUrl) {
    console.log(`${colors.blue}Recording URL:${colors.reset} ${message.recordingUrl}`);
  }
  
  if (message.summary) {
    console.log(`${colors.magenta}Summary:${colors.reset} ${message.summary.substring(0, 100)}...`);
  }
  
  if (message.transcript) {
    console.log(`${colors.white}Transcript:${colors.reset} ${message.transcript.substring(0, 100)}...`);
  }
  
  // Additional processing if needed
}

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
        timestamp: new Date().toISOString(),
        wallet_id: WALLET_ID
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

// Start the server and set up everything
async function startServer() {
  // Start the server
  const server = app.listen(PORT, async () => {
    console.log(`\n${colors.bgMagenta}${colors.white} MCP WEBHOOK AUTOMATION ${colors.reset}`);
    console.log(`${colors.white}Server running on port ${colors.bright}${PORT}${colors.reset}`);
    
    // Get ngrok URL
    const ngrokUrl = await getOrStartNgrok();
    
    if (!ngrokUrl) {
      console.log(`${colors.red}Failed to get ngrok URL. Please start ngrok manually with: ngrok http ${PORT}${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}ngrok URL: ${colors.reset}${ngrokUrl}`);
    
    console.log(`\n${colors.yellow}MCP Webhook server is now running and waiting for events.${colors.reset}`);
    console.log(`${colors.yellow}Press Ctrl+C to stop the server.${colors.reset}`);
  });
  
  // Handle server shutdown
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Shutting down MCP webhook server...${colors.reset}`);
    server.close(() => {
      console.log(`${colors.green}MCP webhook server stopped${colors.reset}`);
      process.exit(0);
    });
  });
}

// Start everything
startServer().catch(err => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, err);
});
