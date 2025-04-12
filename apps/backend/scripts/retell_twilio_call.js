import twilio from 'twilio';
import { Retell } from 'retell-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

async function makeRetellCall() {
  try {
    console.log('Starting RetellAI call with Twilio configuration...');
    console.log('Environment check:');
    console.log('- TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Missing');
    console.log('- TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Missing');
    console.log('- RETELL_API_KEY:', process.env.RETELL_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('- WEBHOOK_URL:', process.env.WEBHOOK_URL ? '✓ Set' : '✗ Missing');

    // Initialize RetellAI client
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY
    });

    // Register call with RetellAI
    console.log('\nRegistering call with RetellAI...');
    const retellResponse = await retell.call.createPhoneCall({
      agent_id: 'agent_1fb1845b5bd5dcf52092c82ad8',
      from_number: '+19714581557',
      to_number: '+971565401583',
      webhook_config: {
        webhook_url: process.env.WEBHOOK_URL,
        webhook_auth_key: process.env.RETELL_API_KEY,
        events: ['call_started', 'call_ended', 'call_analyzed', 'transcription_update', 'stream_connected', 'stream_disconnected']
      },
      debug_mode: true,
      recording_enabled: true,
      recording_channels: 'dual',
      voice_config: {
        voice_id: 'default',
        stability: 0.5,
        similarity: 0.5,
        use_voice_enhancement: true
      },
      connection_config: {
        sip_domain: '5t4n6j0wnrl.sip.livekit.cloud',
        transport: 'tcp',
        timeout_seconds: 60
      }
    });

    console.log('RetellAI Registration:', retellResponse);
    
    // Wait for RetellAI call to be fully registered
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log('\nCall details:');
    console.log('From:', '+19714581557');
    console.log('To:', '+971565401583');

    // Create TwiML for direct SIP connection
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please wait while we connect you to your AI assistant.</Say>
  <Dial timeout="60" answerOnBridge="true">
    <Sip username="${retellResponse.call_id}" password="${process.env.RETELL_API_KEY}">sip:${retellResponse.call_id}@5t4n6j0wnrl.sip.livekit.cloud;transport=tcp?x-retell-agent-id=agent_1fb1845b5bd5dcf52092c82ad8&x-retell-api-key=${process.env.RETELL_API_KEY}</Sip>
  </Dial>
  <Say>We're sorry, but there was an error connecting to the AI assistant. Please try again later.</Say>
</Response>`;

    console.log('\nInitiating Twilio call...');
    const call = await client.calls.create({
      to: '+971565401583',
      from: '+19714581557',
      twiml: twiml,
      statusCallback: `${process.env.WEBHOOK_URL}?api_key=${process.env.RETELL_API_KEY}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      machineDetection: 'Enable'
    });

    console.log('\nCall initiated:');
    console.log('Twilio Call SID:', call.sid);
    console.log('RetellAI Call ID:', retellResponse.call_id);
    console.log('Initial Status:', call.status);

    // Monitor call status with improved error handling
    console.log('\nMonitoring call status...');
    let attempts = 0;
    const maxAttempts = 40;
    let lastStatus = '';

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const twilioStatus = await client.calls(call.sid).fetch();
        if (twilioStatus.status !== lastStatus) {
          console.log(`\nStatus update ${attempts}/${maxAttempts}:`, twilioStatus.status);
          if (twilioStatus.duration) {
            console.log('Duration:', twilioStatus.duration, 'seconds');
          }
          lastStatus = twilioStatus.status;
        }

        if (twilioStatus.status === 'completed' || twilioStatus.status === 'failed' || twilioStatus.status === 'busy' || twilioStatus.status === 'no-answer') {
          if (twilioStatus.status !== 'completed') {
            console.log('Call ended with status:', twilioStatus.status);
            if (twilioStatus.errorMessage) {
              console.log('Error:', twilioStatus.errorMessage);
            }
          }
          break;
        }

        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error checking call status:', error.message);
        // Continue monitoring despite error
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

  } catch (error) {
    console.error('\nError occurred:');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

// Start the call
makeRetellCall();