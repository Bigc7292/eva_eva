/**
 * Webhook Monitor
 *
 * This script monitors webhook events received by the application
 * It logs all webhook events to the console for debugging
 */

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3005;

// Middleware to parse JSON bodies
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
  limit: '10mb'
}));

// Middleware to parse text bodies
app.use(bodyParser.text({
  type: 'text/*',
  limit: '10mb'
}));

// Middleware to log all requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  if (req.body) {
    if (typeof req.body === 'object') {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    } else {
      console.log('Body:', req.body);
    }
  }

  next();
});

// Route to handle webhook events
app.post('/api/webhooks/vapi', (req, res) => {
  console.log('\n===== WEBHOOK EVENT RECEIVED =====');

  try {
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }

    // Extract event type
    let eventType = 'unknown';
    if (body.event) {
      eventType = body.event;
    } else if (body.message && body.message.type) {
      eventType = body.message.type;
    }

    console.log(`Event Type: ${eventType}`);
    console.log('Payload:', JSON.stringify(body, null, 2));

    // Send success response
    res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.status(200).send('Webhook Monitor is running. Send POST requests to /api/webhooks/vapi');
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n===== WEBHOOK MONITOR =====`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/api/webhooks/vapi`);
  console.log(`Ngrok URL: https://a046-91-73-200-83.ngrok-free.app/api/webhooks/vapi`);
  console.log(`\nWaiting for webhook events...`);
});
