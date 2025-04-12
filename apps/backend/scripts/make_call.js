import fetch from 'node-fetch';
import twilio from 'twilio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

async function makeCall() {
  try {
    console.log('Starting call setup...');
    
    // Register call with RetellAI first
    const retellResponse = await fetch('https://api.retell.cc/v1/call/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RETELL_API_KEY}`
      },
      body: JSON.stringify({
        agent_id: 'agent_1fb1845b5bd5dcf52092c82ad8',
        from_number: '+13433149954',
        to_number: '+971565401583',
        direction: 'outbound'
      })
    });

    const retellData = await retellResponse.json();
    console.log('RetellAI registration:', retellData);

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log('Making call with:');
    console.log('From:', '+13433149954');
    console.log('To:', '+971565401583');

    // Create TwiML for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to Eva, your AI real estate assistant.</Say>
  <Pause length="2"/>
  <Dial>
    <Sip>
      sip:${retellData.call_id}@${process.env.TWILIO_SIP_DOMAIN};transport=tcp?x-retell-debug=true&x-twilio-caller-id=${encodeURIComponent('+13433149954')}&x-twilio-called-id=${encodeURIComponent('+971565401583')}
    </Sip>
  </Dial>
</Response>`;

    // Make the call using Twilio client
    const call = await client.calls.create({
      to: '+971565401583',
      from: '+13433149954',
      twiml: twiml,
      statusCallback: process.env.WEBHOOK_URL,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    console.log('Call initiated:', call.sid);
    
    // Monitor call status
    console.log('\nMonitoring call status...');
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`\nStatus check ${attempts}/${maxAttempts}...`);
      
      const twilioCall = await client.calls(call.sid).fetch();
      console.log('Twilio status:', twilioCall.status);
      
      if (twilioCall.status === 'completed' || twilioCall.status === 'failed') {
        if (twilioCall.status === 'failed') {
          console.log('Error:', twilioCall.errorMessage);
        }
        break;
      }

      // Wait 3 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

// Start the call
makeCall(); 