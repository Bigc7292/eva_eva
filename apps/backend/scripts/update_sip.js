import twilio from 'twilio';
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

async function updateSIPDomain() {
  try {
    console.log('Updating SIP Domain configuration...');
    
    const domains = await twilioClient.sip.domains.list();
    const retellDomain = domains.find(d => d.domainName === 'retellaisip.sip.twilio.com');
    
    if (retellDomain) {
      console.log('\nFound RetellAI SIP Domain, updating settings...');
      
      const updatedDomain = await twilioClient.sip.domains(retellDomain.sid).update({
        voiceUrl: 'https://api.retellai.com/v2/webhooks/twilio',
        voiceMethod: 'POST',
        sipRegistration: true,
        secure: true,
        emergencyCallingEnabled: false,
        byocTrunkSid: null,  // Remove trunk SID to use default routing
        voiceFallbackUrl: 'https://api.retellai.com/v2/webhooks/twilio',
        voiceFallbackMethod: 'POST',
        voiceStatusCallbackUrl: process.env.WEBHOOK_URL,
        voiceStatusCallbackMethod: 'POST'
      });
      
      console.log('\nSIP Domain updated successfully:');
      console.log('Domain Name:', updatedDomain.domainName);
      console.log('Status:', updatedDomain.sipRegistration ? 'Active' : 'Inactive');
      console.log('Voice URL:', updatedDomain.voiceUrl);
      console.log('Voice Method:', updatedDomain.voiceMethod);
      console.log('Secure:', updatedDomain.secure);
    } else {
      console.log('\nRetellAI SIP Domain not found!');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

// Run the update
updateSIPDomain(); 