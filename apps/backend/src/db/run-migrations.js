require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath) {
  try {
    console.log(`Running migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('pgmigrate', { query: statement });
      
      if (error) {
        console.error(`Error executing statement: ${statement}`);
        console.error(error);
        throw error;
      }
    }
    
    console.log(`Migration completed successfully: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Migration failed: ${filePath}`);
    console.error(error);
    return false;
  }
}

async function runAllMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure migrations run in order
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const success = await runMigration(filePath);
    
    if (!success) {
      console.error(`Migration failed: ${file}. Stopping.`);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully');
}

// Run migrations
runAllMigrations().catch(error => {
  console.error('Migration process failed:', error);
  process.exit(1);
});
