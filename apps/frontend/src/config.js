import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Loading configuration...');

// Try to load environment variables from different possible locations
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(dirname(dirname(__dirname)), '.env.local'),
  resolve(dirname(dirname(__dirname)), '.env')
];

for (const path of envPaths) {
  if (fs.existsSync(path)) {
    console.log('Loading environment from:', path);
    dotenv.config({ path });
  }
}

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_RETELL_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'WEBHOOK_URL',
  'TWILIO_SIP_DOMAIN',
  'TWILIO_SIP_USERNAME',
  'TWILIO_SIP_PASSWORD'
];

const missingVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const config = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    sipDomain: process.env.TWILIO_SIP_DOMAIN,
    sipUsername: process.env.TWILIO_SIP_USERNAME,
    sipPassword: process.env.TWILIO_SIP_PASSWORD,
    fromNumber: process.env.TWILIO_FROM_NUMBER || '+13433149954'
  },
  retell: {
    apiKey: process.env.NEXT_PUBLIC_RETELL_API_KEY,
    agentId: 'agent_1fb1845b5bd5dcf52092c82ad8',
    webhookUrl: process.env.WEBHOOK_URL
  },
  server: {
    port: process.env.PORT || 3000,
    timezone: process.env.TZ || 'Asia/Dubai'
  }
};

console.log('Configuration loaded successfully');
console.log('Environment variables present:', {
  TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
  TWILIO_SIP_DOMAIN: !!process.env.TWILIO_SIP_DOMAIN,
  WEBHOOK_URL: process.env.WEBHOOK_URL
});

export default config; 