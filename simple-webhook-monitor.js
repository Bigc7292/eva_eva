/**
 * Simple Webhook Monitor
 *
 * This script creates a very simple Express server that logs all incoming requests
 * and responds with a success message. It's designed to monitor webhook events
 * from VAPI or any other service.
 */

const express = require('express');
const app = express();
const PORT = 3004;

// Parse JSON bodies
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Handle all routes
app.all('*', (req, res) => {
  console.log('=== WEBHOOK RECEIVED ===');
  res.status(200).json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n===== SIMPLE WEBHOOK MONITOR =====`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/api/webhooks/vapi`);
  console.log(`Ngrok URL: https://252c-91-73-200-83.ngrok-free.app/api/webhooks/vapi`);
  console.log(`\nWaiting for webhook events...`);
});
