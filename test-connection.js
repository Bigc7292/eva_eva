/**
 * Simple Connection Test
 * Test basic connectivity to Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test 1: Simple query to a system table
    console.log('\n📡 Test 1: Basic connection test');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log(`❌ Auth test failed: ${error.message}`);
    } else {
      console.log('✅ Basic connection successful');
    }
    
    // Test 2: Try to access any existing table
    console.log('\n📡 Test 2: Database access test');
    try {
      const result = await supabase.from('any_table').select('*').limit(1);
      console.log(`Database query result:`, result);
    } catch (dbError) {
      console.log(`Database access result:`, dbError.message);
    }
    
    // Test 3: Check if we can reach the URL
    console.log('\n📡 Test 3: HTTP connectivity test');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log(`HTTP Status: ${response.status}`);
    console.log(`HTTP Status Text: ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('✅ HTTP connection successful');
    } else {
      console.log('❌ HTTP connection failed');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();