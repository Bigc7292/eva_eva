import twilio from 'twilio';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function checkStatus() {
  try {
    console.log('Checking Twilio configuration...');
    
    // Check Twilio account
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('\nTwilio Account Status:', account.status);
    
    // List recent calls
    console.log('\nRecent Twilio Calls:');
    const calls = await twilioClient.calls.list({limit: 5});
    calls.forEach(call => {
      console.log(`\nCall SID: ${call.sid}`);
      console.log(`Status: ${call.status}`);
      console.log(`From: ${call.from}`);
      console.log(`To: ${call.to}`);
      console.log(`Direction: ${call.direction}`);
      console.log(`Duration: ${call.duration} seconds`);
      if (call.errorCode) {
        console.log(`Error Code: ${call.errorCode}`);
        console.log(`Error Message: ${call.errorMessage}`);
      }
    });

    // Check SIP Domain configuration
    console.log('\nTwilio SIP Domain Configuration:');
    const sipDomains = await twilioClient.sip.domains.list();
    sipDomains.forEach(domain => {
      console.log(`\nDomain Name: ${domain.domainName}`);
      console.log(`Status: ${domain.sipRegistration ? 'Active' : 'Inactive'}`);
      console.log(`Voice URL: ${domain.voiceUrl}`);
      console.log(`Fallback URL: ${domain.voiceFallbackUrl}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

// Run the status check
checkStatus(); 