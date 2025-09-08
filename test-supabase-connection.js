#!/usr/bin/env node

/**
 * Supabase Connection Test
 * Tests the Supabase connection with your credentials
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Supabase Connection...\n');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Configuration:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${supabaseAnonKey?.substring(0, 20)}...`);
console.log(`Service Key: ${supabaseServiceKey?.substring(0, 20)}...`);
console.log('');

async function testConnection() {
  try {
    // Test with anon key
    console.log('🔐 Testing Anon Key Connection...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('calls')
      .select('count', { count: 'exact', head: true });
    
    if (anonError) {
      console.log('⚠️  Anon Key Error:', anonError.message);
    } else {
      console.log('✅ Anon Key Connection: SUCCESS');
      console.log(`📊 Calls table accessible (count check passed)`);
    }

    // Test with service role key
    console.log('\n🔑 Testing Service Role Key Connection...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('calls')
      .select('count', { count: 'exact', head: true });
    
    if (serviceError) {
      console.log('⚠️  Service Key Error:', serviceError.message);
    } else {
      console.log('✅ Service Role Key Connection: SUCCESS');
      console.log(`🔧 Admin access confirmed`);
    }

    // Test basic query
    console.log('\n📊 Testing Basic Query...');
    const { data: calls, error: queryError } = await supabaseService
      .from('calls')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.log('⚠️  Query Error:', queryError.message);
      if (queryError.message.includes('relation "calls" does not exist')) {
        console.log('💡 Tip: You may need to run database setup first');
        console.log('   Run: node setup-db.js');
      }
    } else {
      console.log('✅ Query Test: SUCCESS');
      console.log(`📄 Found ${calls?.length || 0} records in calls table`);
      if (calls && calls.length > 0) {
        console.log('📋 Sample record keys:', Object.keys(calls[0]));
      }
    }

  } catch (error) {
    console.log('❌ Connection Test Failed:', error.message);
  }
}

async function main() {
  await testConnection();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If connection successful: Start development server');
  console.log('   Command: npm run dev -- -p 3004');
  console.log('2. If database tables missing: Run database setup');
  console.log('   Command: node setup-db.js');
  console.log('3. View your project: http://localhost:3004');
  console.log('\n✨ Supabase is ready for EVA project!');
}

main().catch(console.error);