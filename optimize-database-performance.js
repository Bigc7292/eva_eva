/**
 * Script to optimize database performance
 * This script will:
 * 1. Create additional indexes for frequently queried columns
 * 2. Create materialized views for expensive queries
 * 3. Set up database statistics for better query planning
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
});

// Logger function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Execute a SQL query
 * @param {string} query - SQL query to execute
 * @returns {Promise<any>} - Query result
 */
async function executeSQL(query) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql: query });
    
    if (error) {
      // If the RPC function doesn't exist, try direct query
      try {
        const { data: directData, error: directError } = await supabase.from('_temp_query').select().sql(query);
        
        if (directError) {
          throw directError;
        }
        
        return directData;
      } catch (directError) {
        log(`Error executing direct SQL: ${directError.message}`);
        throw directError;
      }
    }
    
    return data;
  } catch (error) {
    log(`Error executing SQL: ${error.message}`);
    throw error;
  }
}

/**
 * Create additional indexes for frequently queried columns
 * @returns {Promise<boolean>} - Success status
 */
async function createAdditionalIndexes() {
  try {
    log('Creating additional indexes for frequently queried columns...');
    
    // Create composite indexes for frequently joined columns
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_calls_contact_id_start_time 
      ON calls(contact_id, start_time DESC);
    `);
    log('Created composite index on calls(contact_id, start_time)');
    
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_meetings_contact_id_meeting_time 
      ON meetings(contact_id, meeting_time DESC);
    `);
    log('Created composite index on meetings(contact_id, meeting_time)');
    
    // Create partial indexes for filtered queries
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_calls_answered_partial 
      ON calls(start_time) 
      WHERE call_status IN ('Completed', 'Answered', 'completed', 'answered');
    `);
    log('Created partial index on calls for answered calls');
    
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_partial 
      ON meetings(meeting_time) 
      WHERE status = 'scheduled';
    `);
    log('Created partial index on meetings for scheduled meetings');
    
    // Create expression indexes for case-insensitive searches
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_contacts_name_lower 
      ON contacts(lower(name));
    `);
    log('Created expression index on contacts(lower(name))');
    
    await executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_contacts_phone_normalized 
      ON contacts(regexp_replace(phone_number, '[^0-9]', '', 'g'));
    `);
    log('Created expression index on contacts for normalized phone numbers');
    
    log('Additional indexes created successfully');
    return true;
  } catch (error) {
    log(`Error creating additional indexes: ${error.message}`);
    return false;
  }
}

/**
 * Create materialized views for expensive queries
 * @returns {Promise<boolean>} - Success status
 */
async function createMaterializedViews() {
  try {
    log('Creating materialized views for expensive queries...');
    
    // Create materialized view for call metrics
    await executeSQL(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS call_metrics_materialized AS
      SELECT
        COUNT(*) AS total_calls,
        COUNT(CASE WHEN call_type = 'Outbound' THEN 1 END) AS outbound_calls,
        COUNT(CASE WHEN call_type = 'Inbound' THEN 1 END) AS inbound_calls,
        COUNT(CASE WHEN call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN 1 END) AS answered_calls,
        COUNT(CASE WHEN call_status IN ('Missed', 'No Answer', 'missed', 'no-answer', 'no answer') THEN 1 END) AS missed_calls,
        COALESCE(AVG(CASE WHEN call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN duration END), 0) AS avg_duration,
        COUNT(CASE WHEN transcript IS NOT NULL AND transcript != '' THEN 1 END) AS calls_with_transcript,
        COUNT(CASE WHEN summary IS NOT NULL AND summary != '' THEN 1 END) AS calls_with_summary,
        COUNT(CASE WHEN recording_url IS NOT NULL OR audio_url IS NOT NULL THEN 1 END) AS calls_with_recording
      FROM calls;
    `);
    log('Created materialized view for call metrics');
    
    // Create materialized view for call metrics by day
    await executeSQL(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS call_metrics_by_day_materialized AS
      SELECT
        DATE_TRUNC('day', start_time) AS day,
        COUNT(*) AS total_calls,
        COUNT(CASE WHEN call_type = 'Outbound' THEN 1 END) AS outbound_calls,
        COUNT(CASE WHEN call_type = 'Inbound' THEN 1 END) AS inbound_calls,
        COUNT(CASE WHEN call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN 1 END) AS answered_calls,
        COUNT(CASE WHEN call_status IN ('Missed', 'No Answer', 'missed', 'no-answer', 'no answer') THEN 1 END) AS missed_calls
      FROM calls
      GROUP BY DATE_TRUNC('day', start_time)
      ORDER BY DATE_TRUNC('day', start_time) DESC;
    `);
    log('Created materialized view for call metrics by day');
    
    // Create materialized view for contact profiles with enriched data
    await executeSQL(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS enriched_contacts_materialized AS
      SELECT 
        c.*,
        COUNT(cl.call_id) AS total_calls,
        COUNT(CASE WHEN cl.call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN 1 END) AS answered_calls,
        COUNT(CASE WHEN cl.call_status IN ('Missed', 'No Answer', 'missed', 'no-answer', 'no answer') THEN 1 END) AS missed_calls,
        COALESCE(AVG(CASE WHEN cl.call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN cl.duration END), 0) AS avg_duration,
        MAX(cl.start_time) AS last_call_date,
        (SELECT cl2.call_status FROM calls cl2 WHERE cl2.contact_id = c.contact_id ORDER BY cl2.start_time DESC LIMIT 1) AS last_call_status,
        COUNT(m.meeting_id) AS total_meetings,
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END) AS successful_meetings
      FROM 
        contacts c
      LEFT JOIN 
        calls cl ON c.contact_id = cl.contact_id
      LEFT JOIN 
        meetings m ON c.contact_id = m.contact_id
      GROUP BY 
        c.contact_id;
    `);
    log('Created materialized view for enriched contacts');
    
    // Create function to refresh materialized views
    await executeSQL(`
      CREATE OR REPLACE FUNCTION refresh_materialized_views()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW call_metrics_materialized;
        REFRESH MATERIALIZED VIEW call_metrics_by_day_materialized;
        REFRESH MATERIALIZED VIEW enriched_contacts_materialized;
      END;
      $$ LANGUAGE plpgsql;
    `);
    log('Created function to refresh materialized views');
    
    log('Materialized views created successfully');
    return true;
  } catch (error) {
    log(`Error creating materialized views: ${error.message}`);
    return false;
  }
}

/**
 * Set up database statistics for better query planning
 * @returns {Promise<boolean>} - Success status
 */
async function setupDatabaseStatistics() {
  try {
    log('Setting up database statistics for better query planning...');
    
    // Analyze tables to update statistics
    await executeSQL(`ANALYZE calls;`);
    log('Analyzed calls table');
    
    await executeSQL(`ANALYZE contacts;`);
    log('Analyzed contacts table');
    
    await executeSQL(`ANALYZE meetings;`);
    log('Analyzed meetings table');
    
    log('Database statistics set up successfully');
    return true;
  } catch (error) {
    log(`Error setting up database statistics: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting database performance optimization...');
    
    // Create additional indexes
    const indexesCreated = await createAdditionalIndexes();
    
    // Create materialized views
    const viewsCreated = await createMaterializedViews();
    
    // Set up database statistics
    const statisticsSetUp = await setupDatabaseStatistics();
    
    log('Database performance optimization completed');
    log(`Indexes created: ${indexesCreated ? 'Yes' : 'No'}`);
    log(`Materialized views created: ${viewsCreated ? 'Yes' : 'No'}`);
    log(`Database statistics set up: ${statisticsSetUp ? 'Yes' : 'No'}`);
  } catch (error) {
    log(`Error optimizing database performance: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
