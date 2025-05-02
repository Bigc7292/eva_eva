/**
 * Script to create necessary tables in the database
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Create tables
 */
async function createTables() {
  try {
    log('Creating tables...');

    // Create calls table
    log('Creating calls table...');
    const { error: callsError } = await supabase.rpc('create_calls_table');
    
    if (callsError) {
      log(`Error creating calls table: ${callsError.message}`);
    } else {
      log('Calls table created successfully');
    }

    // Create contacts table if it doesn't exist
    log('Creating contacts table...');
    const { error: contactsError } = await supabase.rpc('create_contacts_table');
    
    if (contactsError) {
      log(`Error creating contacts table: ${contactsError.message}`);
    } else {
      log('Contacts table created successfully');
    }

    log('Tables created successfully');
  } catch (error) {
    log(`Error creating tables: ${error.message}`);
  }
}

// Run the function
createTables().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
