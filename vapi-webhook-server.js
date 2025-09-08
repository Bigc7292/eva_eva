/**
 * VAPI Webhook Server
 *
 * This script creates a server to receive webhook events from VAPI
 * following the official VAPI documentation.
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

// Handle VAPI webhook events - exactly as per VAPI documentation
app.post('/api/webhooks/vapi', (req, res) => {
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

  // Handle according to VAPI documentation
  if (req.body.message) {
    const messageType = req.body.message.type;
    const call = req.body.message.call;

    console.log(`${colors.magenta}Message Type:${colors.reset} ${messageType}`);

    if (call) {
      console.log(`${colors.blue}Call ID:${colors.reset} ${call.id || 'unknown'}`);
      console.log(`${colors.blue}Call Status:${colors.reset} ${call.status || 'unknown'}`);

      // Log organization ID if present
      if (call.orgId) {
        console.log(`${colors.magenta}Organization ID:${colors.reset} ${call.orgId}`);
      }

      // Log metadata if present
      if (call.metadata) {
        console.log(`${colors.yellow}Metadata:${colors.reset}`);
        console.log(JSON.stringify(call.metadata, null, 2));

        // Check for wallet ID in metadata
        if (call.metadata.wallet_id) {
          console.log(`${colors.green}Wallet ID:${colors.reset} ${call.metadata.wallet_id}`);
        }
      }
    }

    // Handle different message types
    switch (messageType) {
      case 'function-call': {
        // Function call from the assistant
        const functionCall = req.body.message.functionCall;
        console.log(`${colors.green}Function Call:${colors.reset} ${functionCall.name}`);
        console.log(`${colors.green}Parameters:${colors.reset} ${functionCall.parameters}`);

        // Return a response for the function call
        return res.status(200).json({
          result: "Function executed successfully"
        });
      }

      case 'assistant-request': {
        // Request for an assistant
        console.log(`${colors.yellow}Assistant Request${colors.reset}`);

        // Return an existing assistant ID
        return res.status(200).json({
          assistantId: "cfaa163c-4a47-471b-a39e-95c12d0cb738"
        });
      }

      case 'status-update': {
        // Call status update
        console.log(`${colors.yellow}Status Update:${colors.reset} ${req.body.message.status || 'unknown'}`);
        break;
      }

      case 'end-of-call-report': {
        // End of call report
        console.log(`${colors.green}End of Call Report${colors.reset}`);

        if (req.body.message.endedReason) {
          console.log(`${colors.yellow}Ended Reason:${colors.reset} ${req.body.message.endedReason}`);
        }

        if (req.body.message.recordingUrl) {
          console.log(`${colors.blue}Recording URL:${colors.reset} ${req.body.message.recordingUrl}`);
        }

        if (req.body.message.summary) {
          console.log(`${colors.magenta}Summary:${colors.reset} ${req.body.message.summary.substring(0, 100)}...`);
        }

        if (req.body.message.transcript) {
          console.log(`${colors.white}Transcript:${colors.reset} ${req.body.message.transcript.substring(0, 100)}...`);
        }
        break;
      }

      case 'hang': {
        // Hang notification
        console.log(`${colors.red}Hang Notification${colors.reset}`);
        break;
      }

      default: {
        console.log(`${colors.white}Unknown Message Type:${colors.reset} ${messageType}`);
        break;
      }
    }
  } else {
    console.log(`${colors.red}Invalid webhook format - missing 'message' property${colors.reset}`);
  }

  // Send success response for non-function calls
  res.status(200).json({ success: true });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log(`${colors.bgYellow}${colors.black} TEST ENDPOINT CALLED ${colors.reset}`);
  res.status(200).json({ success: true, message: 'VAPI Webhook Server is working!' });
});

// Handle all other routes
app.use('/', (req, res) => {
  console.log(`${colors.blue}Request received on non-webhook endpoint${colors.reset}`);
  res.status(200).send('VAPI Webhook Server is running. Send POST requests to /api/webhooks/vapi');
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${colors.bgMagenta}${colors.white} VAPI WEBHOOK SERVER ${colors.reset}`);
  console.log(`${colors.white}Server running on port ${colors.bright}${PORT}${colors.reset}`);
  console.log(`${colors.green}Webhook URL: ${colors.reset}http://localhost:${PORT}/api/webhooks/vapi`);
  console.log(`${colors.yellow}Ngrok URL: ${colors.reset}https://252c-91-73-200-83.ngrok-free.app/api/webhooks/vapi`);
  console.log(`\n${colors.white}Waiting for webhook events...${colors.reset}`);
});
