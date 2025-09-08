import twilio from 'twilio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

async function testTwilio() {
  try {
    console.log('Testing Twilio configuration...');
    
    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Step 1: Check account status
    console.log('\nStep 1: Checking account status...');
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('Account Status:', account.status);
    console.log('Account Type:', account.type);
    
    // Step 2: Check phone numbers
    console.log('\nStep 2: Checking phone numbers...');
    const numbers = await client.incomingPhoneNumbers.list({limit: 20});
    console.log('Available Phone Numbers:');
    numbers.forEach(number => {
      console.log(`- ${number.phoneNumber} (${number.friendlyName})`);
    });

    // Step 3: Check SIP Domain
    console.log('\nStep 3: Checking SIP Domain configuration...');
    const domains = await client.sip.domains.list();
    console.log('SIP Domains:');
    domains.forEach(domain => {
      console.log(`- Domain: ${domain.domainName}`);
      console.log(`  Status: ${domain.sipRegistration ? 'Active' : 'Inactive'}`);
      console.log(`  Voice URL: ${domain.voiceUrl}`);
    });

    // Step 4: Check voice settings
    console.log('\nStep 4: Checking voice settings...');
    const settings = await client.account.settings().fetch();
    console.log('Voice Settings:');
    console.log('- Voice Geographic Permissions:', settings.voiceRegionalPermissions);
    console.log('- International Permissions:', settings.internationalPermissions);

    console.log('\nTwilio configuration test completed successfully!');
  } catch (error) {
    console.error('\nError testing Twilio configuration:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    console.error('\nPlease check:');
    console.error('1. Your Account SID and Auth Token are correct');
    console.error('2. Your account is active and has sufficient funds');
    console.error('3. You have the necessary permissions enabled');
  }
}

// Run the test
testTwilio(); 