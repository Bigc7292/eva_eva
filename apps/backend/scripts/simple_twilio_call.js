import twilio from 'twilio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

async function makeSimpleCall() {
  try {
    console.log('Making a simple Twilio call with voice input enabled...');
    
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log('Call details:');
    console.log('From:', '+13433149954');
    console.log('To:', '+971565401583');

    // Create TwiML with Gather for voice input
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Initial greeting
    twiml.say({ 
      voice: 'alice',
      language: 'en-US'
    }, 'Hello! This is a test call. I will now listen for your voice.');
    
    // Add Gather for voice input
    const gather = twiml.gather({
      input: 'speech',
      timeout: 3,
      language: 'en-US',
      action: `${process.env.WEBHOOK_URL}/gather`,
      method: 'POST'
    });
    
    gather.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Please speak now. I am listening.');
    
    // Add fallback if no input received
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'I did not hear anything. The call will end now.');

    console.log('\nTwiML being used:', twiml.toString());

    // Make the call with detailed options
    const call = await client.calls.create({
      twiml: twiml.toString(),
      to: '+971565401583',
      from: '+13433149954',
      record: true,
      timeout: 60,
      statusCallback: process.env.WEBHOOK_URL,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    console.log('\nCall initiated:');
    console.log('Call SID:', call.sid);
    console.log('Initial Status:', call.status);

    // Monitor call status
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`\nStatus check ${attempts}/${maxAttempts}...`);
      
      const callStatus = await client.calls(call.sid).fetch();
      console.log('Status:', callStatus.status);
      console.log('Duration:', callStatus.duration, 'seconds');
      
      if (callStatus.status === 'completed' || callStatus.status === 'failed') {
        if (callStatus.status === 'failed') {
          console.log('Error:', callStatus.errorMessage);
        } else {
          console.log('Call completed successfully');
          // Get call recording if available
          const recordings = await client.recordings.list({callSid: call.sid});
          if (recordings.length > 0) {
            console.log('Recording URL:', recordings[0].mediaUrl);
          }
        }
        break;
      }

      // Wait 3 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (error) {
    console.error('\nError making call:');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.moreInfo) {
      console.error('More Info:', error.moreInfo);
    }
  }
}

// Make the test call
makeSimpleCall(); 