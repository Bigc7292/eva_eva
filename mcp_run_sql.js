// Run SQL schema setup on Supabase via MCP
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runSqlScript() {
  const sql = fs.readFileSync('setup_database.sql', 'utf-8');
  // Split by semicolon and run each statement (Supabase only allows single statement per call)
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('execute_sql', { sql: stmt });
      if (error) {
        console.error('Error executing:', stmt, error);
      } else {
        console.log('Executed:', stmt.slice(0, 60));
      }
    } catch (err) {
      console.error('Exception executing:', stmt, err);
    }
  }
}

runSqlScript().then(() => process.exit(0));
