#!/usr/bin/env node

/**
 * Environment Variables Verification
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Variables Check\n');

const envVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'PORT': process.env.PORT,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL
};

console.log('📋 Configuration Status:');
console.log('========================');

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    if (key.includes('KEY') || key.includes('SECRET')) {
      console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
});

console.log('\n🎯 Summary:');
const missingVars = Object.entries(envVars).filter(([_, value]) => !value);

if (missingVars.length === 0) {
  console.log('✅ All required Supabase variables are configured!');
  console.log('\n🚀 Ready to start development server:');
  console.log('   npm run dev -- -p 3004');
} else {
  console.log(`❌ Missing ${missingVars.length} required variables:`);
  missingVars.forEach(([key]) => console.log(`   - ${key}`));
}

console.log('\n📊 Your Supabase Project:');
console.log(`   Project: stexfwbuwyyfmkmxcftv`);
console.log(`   URL: https://stexfwbuwyyfmkmxcftv.supabase.co`);
console.log(`   Dashboard: https://supabase.com/dashboard/project/stexfwbuwyyfmkmxcftv`);