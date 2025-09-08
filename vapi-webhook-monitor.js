/**
 * VAPI Webhook Monitor
 * 
 * This script creates a simple Express server that logs all incoming VAPI webhook events
 * with color-coded output for better visibility.
 */

const express = require('express');
const app = express();
const PORT = 3004;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
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

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Raw body parser for signature verification
app.use((req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  
  req.on('data', (chunk) => {
    data += chunk;
  });
  
  req.on('end', () => {
    req.rawBody = data;
    
    // Try to parse as JSON if content-type is application/json
    if (req.headers['content-type']?.includes('application/json')) {
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        console.log(`${colors.red}Error parsing JSON:${colors.reset}`, e.message);
      }
    }
    
    next();
  });
});

// Log all requests with color
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${colors.cyan}[${timestamp}] ${req.method} ${req.url}${colors.reset}`);
  
  if (Object.keys(req.headers).length > 0) {
    console.log(`${colors.yellow}Headers:${colors.reset}`);
    for (const [key, value] of Object.entries(req.headers)) {
      console.log(`  ${colors.dim}${key}:${colors.reset} ${value}`);
    }
  }
  
  next();
});

// Handle VAPI webhook events
app.all('/api/webhooks/vapi', (req, res) => {
  console.log(`\n${colors.bgGreen}${colors.black} VAPI WEBHOOK EVENT RECEIVED ${colors.reset}\n`);
  
  // Check if body exists
  if (!req.body || Object.keys(req.body).length === 0) {
    console.log(`${colors.red}Empty or invalid webhook payload${colors.reset}`);
    console.log(`${colors.yellow}Raw body:${colors.reset}`, req.rawBody);
    return res.status(200).json({ success: true });
  }
  
  // Log the full webhook payload
  console.log(`${colors.green}Full webhook payload:${colors.reset}`);
  console.log(JSON.stringify(req.body, null, 2));
  
  // Determine event type (handle both legacy and new formats)
  let eventType = 'unknown';
  let callId = 'unknown';
  
  // Check for new format (2025)
  if (req.body.message && (req.body.message.type === 'status-update' || req.body.message.type === 'end-of-call-report')) {
    eventType = req.body.message.type;
    callId = req.body.message.call?.id || 'unknown';
    
    console.log(`${colors.magenta}New Format Event:${colors.reset} ${eventType}`);
    console.log(`${colors.blue}Call ID:${colors.reset} ${callId}`);
    
    // Process different message types with different colors
    switch (eventType) {
      case 'status-update':
        const status = req.body.message.call?.status || 'unknown';
        console.log(`${colors.yellow}Call Status:${colors.reset} ${status}`);
        break;
        
      case 'end-of-call-report':
        console.log(`${colors.green}End of Call Report${colors.reset}`);
        if (req.body.message.call?.duration) {
          console.log(`${colors.yellow}Duration:${colors.reset} ${req.body.message.call.duration} seconds`);
        }
        if (req.body.message.transcript) {
          console.log(`${colors.blue}Transcript:${colors.reset} ${req.body.message.transcript.substring(0, 100)}...`);
        }
        if (req.body.message.summary) {
          console.log(`${colors.magenta}Summary:${colors.reset} ${req.body.message.summary.substring(0, 100)}...`);
        }
        break;
    }
  } 
  // Legacy format
  else if (req.body.event) {
    eventType = req.body.event;
    callId = req.body.call_id || 'unknown';
    
    console.log(`${colors.magenta}Legacy Event:${colors.reset} ${eventType}`);
    console.log(`${colors.blue}Call ID:${colors.reset} ${callId}`);
    
    // Process different event types with different colors
    switch (eventType) {
      case 'call.started':
        console.log(`${colors.green}Call Started${colors.reset}`);
        if (req.body.data?.to) {
          console.log(`${colors.yellow}To:${colors.reset} ${req.body.data.to}`);
        }
        if (req.body.data?.from) {
          console.log(`${colors.yellow}From:${colors.reset} ${req.body.data.from}`);
        }
        break;
        
      case 'call.ended':
        console.log(`${colors.red}Call Ended${colors.reset}`);
        if (req.body.data?.duration) {
          console.log(`${colors.yellow}Duration:${colors.reset} ${req.body.data.duration} seconds`);
        }
        break;
        
      case 'transcript.created':
        console.log(`${colors.blue}Transcript Created${colors.reset}`);
        if (req.body.data?.transcript) {
          console.log(`${colors.white}Transcript:${colors.reset} ${req.body.data.transcript.substring(0, 100)}...`);
        }
        break;
        
      case 'recording.created':
        console.log(`${colors.yellow}Recording Created${colors.reset}`);
        if (req.body.data?.recording_url) {
          console.log(`${colors.white}Recording URL:${colors.reset} ${req.body.data.recording_url}`);
        }
        break;
        
      case 'summary.created':
        console.log(`${colors.magenta}Summary Created${colors.reset}`);
        if (req.body.data?.summary) {
          console.log(`${colors.white}Summary:${colors.reset} ${req.body.data.summary.substring(0, 100)}...`);
        }
        break;
        
      case 'analysis.created':
        console.log(`${colors.cyan}Analysis Created${colors.reset}`);
        if (req.body.data?.structuredData) {
          console.log(`${colors.white}Structured Data:${colors.reset}`, JSON.stringify(req.body.data.structuredData, null, 2));
        }
        break;
        
      case 'call.status_updated':
        console.log(`${colors.yellow}Call Status Updated${colors.reset}`);
        if (req.body.data?.status) {
          console.log(`${colors.white}Status:${colors.reset} ${req.body.data.status}`);
        }
        break;
        
      default:
        console.log(`${colors.white}Unhandled Event Type:${colors.reset} ${eventType}`);
    }
  }
  
  // Send success response
  res.status(200).json({ success: true });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log(`${colors.bgYellow}${colors.black} TEST ENDPOINT CALLED ${colors.reset}`);
  res.status(200).json({ success: true, message: 'VAPI Webhook Monitor is working!' });
});

// Handle all other routes
app.use('/', (req, res) => {
  console.log(`${colors.blue}Request received on non-webhook endpoint${colors.reset}`);
  res.status(200).send('VAPI Webhook Monitor is running. Send POST requests to /api/webhooks/vapi');
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${colors.bgMagenta}${colors.white} VAPI WEBHOOK MONITOR ${colors.reset}`);
  console.log(`${colors.white}Server running on port ${colors.bright}${PORT}${colors.reset}`);
  console.log(`${colors.green}Webhook URL: ${colors.reset}http://localhost:${PORT}/api/webhooks/vapi`);
  console.log(`${colors.yellow}Ngrok URL: ${colors.reset}https://252c-91-73-200-83.ngrok-free.app/api/webhooks/vapi`);
  console.log(`\n${colors.white}Waiting for webhook events...${colors.reset}`);
});
