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
  'NEXT_PUBLIC_VAPI_API_KEY',
  'NEXT_PUBLIC_VAPI_ASSISTANT_ID',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
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
    fromNumber: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+19143713101'
  },
  vapi: {
    apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY,
    privateApiKey: process.env.NEXT_PRIVATE_VAPI_API_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY,
    assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
    apiUrl: process.env.NEXT_PUBLIC_VAPI_API_URL || 'https://api.vapi.ai'
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  server: {
    port: process.env.PORT || 3001,
    timezone: process.env.TZ || 'Asia/Dubai'
  }
};

console.log('Configuration loaded successfully');
console.log('Environment variables present:', {
  TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
  NEXT_PUBLIC_VAPI_API_KEY: !!process.env.NEXT_PUBLIC_VAPI_API_KEY,
  NEXT_PUBLIC_VAPI_ASSISTANT_ID: !!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
  NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL
});

export default config;