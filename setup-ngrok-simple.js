/**
 * VAPI Ngrok Setup Script (Simple Version)
 * 
 * This script sets up ngrok to create a public URL for your local server.
 * After running this script, you'll need to manually update the VAPI server URLs.
 * 
 * Prerequisites:
 * 1. Install ngrok: npm install -g ngrok
 * 2. Set up ngrok authentication: ngrok authtoken YOUR_AUTH_TOKEN
 * 
 * Usage:
 * node setup-ngrok-simple.js
 */

const { exec } = require('child_process');
const http = require('http');

// Local server port
const PORT = 3004;

// Start ngrok
function startNgrok() {
  console.log(`Starting ngrok on port ${PORT}...`);
  
  const ngrokProcess = exec(`ngrok http ${PORT}`, (error) => {
    if (error) {
      console.error('Error starting ngrok:', error);
    }
  });
  
  // Give ngrok a moment to start
  setTimeout(() => {
    // Get the ngrok URL
    http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data).tunnels;
          const httpsUrl = tunnels.find(t => t.proto === 'https').public_url;
          
          console.log(`\n=== VAPI Webhook Setup ===`);
          console.log(`Ngrok HTTPS URL: ${httpsUrl}`);
          console.log(`\nTo update VAPI server URLs, use this webhook URL:`);
          console.log(`${httpsUrl}/api/webhooks/vapi`);
          console.log(`\nYou can update the server URLs in the VAPI dashboard or run:`);
          console.log(`npx ts-node vapi_debug.ts`);
          console.log(`\nKeep this terminal window open to maintain the ngrok tunnel.`);
          console.log(`Press Ctrl+C to stop ngrok and terminate the tunnel.`);
        } catch (parseError) {
          console.error('Error parsing ngrok response:', parseError);
        }
      });
    }).on('error', (error) => {
      console.error('Error getting ngrok URL:', error);
    });
  }, 2000);
}

// Run the script
startNgrok();
