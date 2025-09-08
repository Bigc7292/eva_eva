// check_supabase_calls.js
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual values from .env
const SUPABASE_URL = '[https://stexfwbuwyyfmkmxcftv.supabase.co](https://stexfwbuwyyfmkmxcftv.supabase.co)';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  // TODO: Replace 'calls' with your actual table name if different
  // Optionally, filter by your phone number or user id if needed
  let { data, error } = await supabase
    .from('calls')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching calls:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No call records found.');
    return;
  }

  data.forEach((call, idx) => {
    console.log(`\n=== Call Record #${idx + 1} ===`);
    console.log(call);
  });
}
main();