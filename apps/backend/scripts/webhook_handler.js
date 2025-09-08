import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const app = express();

// Security headers
app.use((req, res, next) => {
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-retell-auth-key');
  
  // Redirect HTTP to HTTPS
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  
  // Log all incoming requests
  console.log('\nIncoming request:');
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Support both JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root endpoint for health check
app.get('/', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({ 
    status: 'Server is running',
    endpoints: {
      '/': 'Health check endpoint',
      '/webhook': 'RetellAI and Twilio webhook endpoint'
    },
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint - handle both GET and POST
app.all('/webhook', (req, res) => {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'Webhook endpoint is active',
        supported_methods: ['GET', 'POST'],
        supported_events: [
          'call_started',
          'call_ended',
          'call_analyzed',
          'transcription_update'
        ],
        documentation: 'This endpoint handles webhook events from RetellAI and Twilio',
        timestamp: new Date().toISOString()
      });
    }

    // Log all incoming webhook requests
    console.log('\nReceived webhook event:');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Get API key from query params, headers, or body
    const webhookApiKey = req.query.api_key || 
                         req.headers['x-retell-auth-key'] || 
                         req.body.auth_key;

    // Check if this is a Twilio event
    if (req.body.CallSid) {
      console.log('\nProcessing Twilio event:', req.body);
      
      // Generate TwiML response for Twilio if needed
      if (req.body.CallStatus === 'in-progress' && !req.body.SipResponseCode) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please wait while we connect you to your AI assistant.</Say>
  <Dial timeout="60" answerOnBridge="true">
    <Sip username="${req.body.CallSid}" password="${process.env.RETELL_API_KEY}">sip:${req.body.CallSid}@5t4n6j0wnrl.sip.livekit.cloud;transport=tcp?x-retell-agent-id=agent_1fb1845b5bd5dcf52092c82ad8&x-retell-api-key=${process.env.RETELL_API_KEY}</Sip>
  </Dial>
</Response>`;
        res.type('text/xml');
        return res.send(twiml);
      }
      
      return res.status(200).json({ status: 'OK' });
    }
    
    // Check if this is a RetellAI event
    if (webhookApiKey === process.env.RETELL_API_KEY) {
      console.log('\nProcessing RetellAI event:', req.body);
      
      switch (req.body.event_type) {
        case 'call_started':
          console.log(`RetellAI call started - ID: ${req.body.call_id}`);
          break;
        case 'call_ended':
          console.log(`RetellAI call ended - ID: ${req.body.call_id}`);
          console.log('Duration:', req.body.duration_seconds, 'seconds');
          break;
        case 'call_analyzed':
          console.log(`RetellAI call analyzed - ID: ${req.body.call_id}`);
          break;
        case 'transcription_update':
          console.log(`RetellAI transcription - ID: ${req.body.call_id}`);
          console.log('Transcript:', req.body.transcript);
          break;
        default:
          console.log(`Unknown RetellAI event type: ${req.body.event_type}`);
      }
      
      return res.status(200).json({ status: 'OK' });
    }

    // Invalid or missing API key
    console.warn('Warning: Invalid or missing API key in webhook request');
    return res.status(200).json({ status: 'OK' });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ status: 'OK' }); // Always return 200 for webhooks
  }
});

// Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    available_endpoints: ['/webhook', '/'],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n=== Webhook Server Configuration ===');
  console.log(`Server running on port: ${PORT}`);
  console.log(`Webhook URL: ${process.env.WEBHOOK_URL}`);
  console.log(`RetellAI API Key: ${process.env.RETELL_API_KEY.substring(0, 8)}...`);
  console.log('\nWaiting for webhook events...');
  console.log('Server will handle the following events:');
  console.log('1. call_started - When the call begins');
  console.log('2. call_ended - When the call completes');
  console.log('3. call_analyzed - When call analysis is complete');
  console.log('4. transcription_update - When new transcripts are available');
  console.log('5. stream_connected - When audio stream is established');
  console.log('6. stream_disconnected - When audio stream ends\n');
}); 