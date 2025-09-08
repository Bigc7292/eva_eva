const express = require('express');
const app = express();
const PORT = 3004;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Middleware to log all requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }

  next();
});

// Route to handle webhook events
app.post('/api/webhooks/vapi', (req, res) => {
  console.log('\n===== WEBHOOK EVENT RECEIVED =====');
  console.log('Payload:', JSON.stringify(req.body, null, 2));

  // Send success response
  res.status(200).json({ success: true, message: 'Webhook received' });
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
