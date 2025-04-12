import twilio from 'twilio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

async function makeDirectCall() {
  try {
    console.log('Making direct Twilio call...');
    
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log('Making call with:');
    console.log('From:', '+13433149954');
    console.log('To:', '+971565401583');

    // Create TwiML to say a simple message
    const twimlUrl = 'https://handler.twilio.com/twiml/EH8ccdbd7f0b8fe34357da8ce87eba38a4';
    
    // Make the call
    const call = await client.calls.create({
      to: '+971565401583',
      from: '+13433149954',
      url: twimlUrl,
      statusCallback: process.env.WEBHOOK_URL,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    console.log('Call initiated:');
    console.log('Call SID:', call.sid);
    console.log('Initial Status:', call.status);

    // Monitor call status
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`\nStatus check ${attempts}/${maxAttempts}...`);
      
      const callStatus = await client.calls(call.sid).fetch();
      console.log('Status:', callStatus.status);
      console.log('Duration:', callStatus.duration, 'seconds');
      
      if (callStatus.status === 'completed' || callStatus.status === 'failed') {
        if (callStatus.status === 'failed') {
          console.log('Error:', callStatus.errorMessage);
        }
        break;
      }

      // Wait 3 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (error) {
    console.error('Error making call:', error);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

// Make the test call
makeDirectCall(); 