// check_latest_supabase_call.js
// Usage: node check_latest_supabase_call.js
// Prints the most recent call from the Supabase 'calls' table.

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest call:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('No calls found in the database.');
      return;
    }

    const call = data[0];
    console.log('Latest call record:');
    console.log(JSON.stringify(call, null, 2));
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
