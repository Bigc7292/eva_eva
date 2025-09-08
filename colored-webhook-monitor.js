/**
 * Colored Webhook Monitor
 *
 * This script creates a simple Express server that logs all incoming webhook events
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

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`${colors.green}Body:${colors.reset}`);
    console.log(JSON.stringify(req.body, null, 2));
  }

  next();
});

// Handle webhook events - accept both POST and GET
app.all('/api/webhooks/vapi', (req, res) => {
  console.log(`\n${colors.bgGreen}${colors.black} WEBHOOK EVENT RECEIVED ${colors.reset}\n`);

  // Determine event type
  const eventType = req.body.event || req.body.message?.type || 'unknown';

  console.log(`${colors.magenta}Event Type:${colors.reset} ${eventType}`);

  // Process different event types with different colors
  switch (eventType) {
    case 'call.started':
      console.log(`${colors.green}Call Started:${colors.reset} ${req.body.call_id}`);
      break;
    case 'call.ended':
      console.log(`${colors.red}Call Ended:${colors.reset} ${req.body.call_id}`);
      break;
    case 'transcript.created':
      console.log(`${colors.blue}Transcript Created:${colors.reset} ${req.body.call_id}`);
      break;
    case 'recording.created':
      console.log(`${colors.yellow}Recording Created:${colors.reset} ${req.body.call_id}`);
      break;
    case 'summary.created':
      console.log(`${colors.magenta}Summary Created:${colors.reset} ${req.body.call_id}`);
      break;
    case 'analysis.created':
      console.log(`${colors.cyan}Analysis Created:${colors.reset} ${req.body.call_id}`);
      break;
    case 'status-update':
      console.log(`${colors.yellow}Status Update:${colors.reset} ${req.body.message?.call?.id}`);
      break;
    case 'end-of-call-report':
      console.log(`${colors.green}End of Call Report:${colors.reset} ${req.body.message?.call?.id}`);
      break;
    default:
      console.log(`${colors.white}Unknown Event:${colors.reset} ${eventType}`);
  }

  // Send success response
  res.status(200).json({ success: true });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log(`${colors.bgYellow}${colors.black} TEST ENDPOINT CALLED ${colors.reset}`);
  res.status(200).json({ success: true, message: 'Webhook monitor is working!' });
});

// Handle all other routes
app.use('/', (req, res) => {
  console.log(`${colors.blue}Request received on non-webhook endpoint${colors.reset}`);
  res.status(200).send('Webhook Monitor is running. Send POST requests to /api/webhooks/vapi');
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${colors.bgMagenta}${colors.white} COLORED WEBHOOK MONITOR ${colors.reset}`);
  console.log(`${colors.white}Server running on port ${colors.bright}${PORT}${colors.reset}`);
  console.log(`${colors.green}Webhook URL: ${colors.reset}http://localhost:${PORT}/api/webhooks/vapi`);
  console.log(`${colors.yellow}Ngrok URL: ${colors.reset}https://252c-91-73-200-83.ngrok-free.app/api/webhooks/vapi`);
  console.log(`\n${colors.white}Waiting for webhook events...${colors.reset}`);
});
