/**
 * Script to fix database schema issues
 * This script will:
 * 1. Check if required tables exist
 * 2. Create missing tables if needed
 * 3. Add missing columns to existing tables
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
 * Check if a table exists
 * @param {string} tableName - Table name
 * @returns {Promise<boolean>} - True if table exists
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('_temp_query')
      .select()
      .sql(`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      );`);
    
    if (error) {
      throw error;
    }
    
    return data[0].exists;
  } catch (error) {
    log(`Error checking if table ${tableName} exists: ${error.message}`);
    return false;
  }
}

/**
 * Check if a column exists in a table
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @returns {Promise<boolean>} - True if column exists
 */
async function columnExists(tableName, columnName) {
  try {
    const { data, error } = await supabase
      .from('_temp_query')
      .select()
      .sql(`SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        AND column_name = '${columnName}'
      );`);
    
    if (error) {
      throw error;
    }
    
    return data[0].exists;
  } catch (error) {
    log(`Error checking if column ${columnName} exists in table ${tableName}: ${error.message}`);
    return false;
  }
}

/**
 * Create contacts table if it doesn't exist
 * @returns {Promise<boolean>} - Success status
 */
async function createContactsTable() {
  try {
    const exists = await tableExists('contacts');
    
    if (exists) {
      log('Contacts table already exists');
      return true;
    }
    
    log('Creating contacts table...');
    
    const { error } = await supabase
      .from('_temp_query')
      .select()
      .sql(`CREATE TABLE contacts (
        contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT,
        phone_number TEXT,
        email TEXT,
        status TEXT DEFAULT 'new',
        property_interest TEXT,
        budget NUMERIC,
        location TEXT,
        nationality TEXT,
        notes TEXT,
        transcripts JSONB DEFAULT '[]'::jsonb,
        summaries JSONB DEFAULT '[]'::jsonb,
        audio_files JSONB DEFAULT '[]'::jsonb,
        ai_ratings JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`);
    
    if (error) {
      throw error;
    }
    
    log('Contacts table created successfully');
    return true;
  } catch (error) {
    log(`Error creating contacts table: ${error.message}`);
    return false;
  }
}

/**
 * Create calls table if it doesn't exist
 * @returns {Promise<boolean>} - Success status
 */
async function createCallsTable() {
  try {
    const exists = await tableExists('calls');
    
    if (exists) {
      log('Calls table already exists');
      return true;
    }
    
    log('Creating calls table...');
    
    const { error } = await supabase
      .from('_temp_query')
      .select()
      .sql(`CREATE TABLE calls (
        call_id TEXT PRIMARY KEY,
        contact_id UUID REFERENCES contacts(contact_id),
        phone_number TEXT,
        call_type TEXT,
        call_status TEXT,
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        duration INTEGER,
        recording_url TEXT,
        audio_url TEXT,
        transcript TEXT,
        summary TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`);
    
    if (error) {
      throw error;
    }
    
    log('Calls table created successfully');
    return true;
  } catch (error) {
    log(`Error creating calls table: ${error.message}`);
    return false;
  }
}

/**
 * Create meetings table if it doesn't exist
 * @returns {Promise<boolean>} - Success status
 */
async function createMeetingsTable() {
  try {
    const exists = await tableExists('meetings');
    
    if (exists) {
      log('Meetings table already exists');
      return true;
    }
    
    log('Creating meetings table...');
    
    const { error } = await supabase
      .from('_temp_query')
      .select()
      .sql(`CREATE TABLE meetings (
        meeting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        contact_id UUID REFERENCES contacts(contact_id),
        call_id TEXT REFERENCES calls(call_id),
        meeting_time TIMESTAMP WITH TIME ZONE,
        location TEXT,
        property_type TEXT,
        budget NUMERIC,
        notes TEXT,
        status TEXT DEFAULT 'scheduled',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );`);
    
    if (error) {
      throw error;
    }
    
    log('Meetings table created successfully');
    return true;
  } catch (error) {
    log(`Error creating meetings table: ${error.message}`);
    return false;
  }
}

/**
 * Add missing columns to contacts table
 * @returns {Promise<boolean>} - Success status
 */
async function addMissingColumnsToContacts() {
  try {
    log('Checking for missing columns in contacts table...');
    
    // Check if transcripts column exists
    const transcriptsExists = await columnExists('contacts', 'transcripts');
    
    if (!transcriptsExists) {
      log('Adding transcripts column to contacts table...');
      
      const { error: transcriptsError } = await supabase
        .from('_temp_query')
        .select()
        .sql(`ALTER TABLE contacts ADD COLUMN transcripts JSONB DEFAULT '[]'::jsonb;`);
      
      if (transcriptsError) {
        throw transcriptsError;
      }
      
      log('Added transcripts column to contacts table');
    }
    
    // Check if summaries column exists
    const summariesExists = await columnExists('contacts', 'summaries');
    
    if (!summariesExists) {
      log('Adding summaries column to contacts table...');
      
      const { error: summariesError } = await supabase
        .from('_temp_query')
        .select()
        .sql(`ALTER TABLE contacts ADD COLUMN summaries JSONB DEFAULT '[]'::jsonb;`);
      
      if (summariesError) {
        throw summariesError;
      }
      
      log('Added summaries column to contacts table');
    }
    
    // Check if audio_files column exists
    const audioFilesExists = await columnExists('contacts', 'audio_files');
    
    if (!audioFilesExists) {
      log('Adding audio_files column to contacts table...');
      
      const { error: audioFilesError } = await supabase
        .from('_temp_query')
        .select()
        .sql(`ALTER TABLE contacts ADD COLUMN audio_files JSONB DEFAULT '[]'::jsonb;`);
      
      if (audioFilesError) {
        throw audioFilesError;
      }
      
      log('Added audio_files column to contacts table');
    }
    
    // Check if ai_ratings column exists
    const aiRatingsExists = await columnExists('contacts', 'ai_ratings');
    
    if (!aiRatingsExists) {
      log('Adding ai_ratings column to contacts table...');
      
      const { error: aiRatingsError } = await supabase
        .from('_temp_query')
        .select()
        .sql(`ALTER TABLE contacts ADD COLUMN ai_ratings JSONB DEFAULT '[]'::jsonb;`);
      
      if (aiRatingsError) {
        throw aiRatingsError;
      }
      
      log('Added ai_ratings column to contacts table');
    }
    
    log('All missing columns added to contacts table');
    return true;
  } catch (error) {
    log(`Error adding missing columns to contacts table: ${error.message}`);
    return false;
  }
}

/**
 * Add missing columns to calls table
 * @returns {Promise<boolean>} - Success status
 */
async function addMissingColumnsToCalls() {
  try {
    log('Checking for missing columns in calls table...');
    
    // Check if contact_id column exists
    const contactIdExists = await columnExists('calls', 'contact_id');
    
    if (!contactIdExists) {
      log('Adding contact_id column to calls table...');
      
      const { error: contactIdError } = await supabase
        .from('_temp_query')
        .select()
        .sql(`ALTER TABLE calls ADD COLUMN contact_id UUID REFERENCES contacts(contact_id);`);
      
      if (contactIdError) {
        throw contactIdError;
      }
      
      log('Added contact_id column to calls table');
    }
    
    // Check if recording_url column exists
    const recordingUrlExists = await columnExists('calls', 'recording_url');
    
    if (!recordingUrlExists) {
      log('Adding recording_url column to calls table...');
      
      const { error: recordingUrlError } = await supabase
        .from('_temp_query')
        .select()
        .sql(`ALTER TABLE calls ADD COLUMN recording_url TEXT;`);
      
      if (recordingUrlError) {
        throw recordingUrlError;
      }
      
      log('Added recording_url column to calls table');
    }
    
    // Check if audio_url column exists
    const audioUrlExists = await columnExists('calls', 'audio_url');
    
    if (!audioUrlExists) {
      log('Adding audio_url column to calls table...');
      
      const { error: audioUrlError } = await supabase
        .from('_temp_query')
        .select()
        .sql(`ALTER TABLE calls ADD COLUMN audio_url TEXT;`);
      
      if (audioUrlError) {
        throw audioUrlError;
      }
      
      log('Added audio_url column to calls table');
    }
    
    log('All missing columns added to calls table');
    return true;
  } catch (error) {
    log(`Error adding missing columns to calls table: ${error.message}`);
    return false;
  }
}

/**
 * Create a sample contact if none exist
 * @returns {Promise<boolean>} - Success status
 */
async function createSampleContact() {
  try {
    // Check if any contacts exist
    const { count, error: countError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    if (count > 0) {
      log(`${count} contacts already exist, no need to create a sample contact`);
      return true;
    }
    
    log('Creating a sample contact...');
    
    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          name: 'John Doe',
          phone_number: '+1234567890',
          email: 'john.doe@example.com',
          status: 'new',
          property_interest: 'Apartment',
          budget: 500000,
          location: 'Downtown',
          nationality: 'American',
          notes: 'This is a sample contact created by the database fix script.',
          transcripts: [],
          summaries: [],
          audio_files: [],
          ai_ratings: []
        }
      ])
      .select();
    
    if (error) {
      throw error;
    }
    
    log(`Created sample contact with ID: ${data[0].contact_id}`);
    return true;
  } catch (error) {
    log(`Error creating sample contact: ${error.message}`);
    return false;
  }
}

/**
 * Create a sample call if none exist
 * @returns {Promise<boolean>} - Success status
 */
async function createSampleCall() {
  try {
    // Check if any calls exist
    const { count, error: countError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    if (count > 0) {
      log(`${count} calls already exist, no need to create a sample call`);
      return true;
    }
    
    // Get a contact ID
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('contact_id')
      .limit(1)
      .single();
    
    if (contactError) {
      throw contactError;
    }
    
    log('Creating a sample call...');
    
    const { data, error } = await supabase
      .from('calls')
      .insert([
        {
          call_id: `sample-${Date.now()}`,
          contact_id: contactData.contact_id,
          phone_number: '+1234567890',
          call_type: 'Outbound',
          call_status: 'Completed',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 60000).toISOString(),
          duration: 60,
          transcript: 'This is a sample transcript.',
          summary: 'This is a sample summary.',
          metadata: {}
        }
      ])
      .select();
    
    if (error) {
      throw error;
    }
    
    log(`Created sample call with ID: ${data[0].call_id}`);
    return true;
  } catch (error) {
    log(`Error creating sample call: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting database schema fix...');
    
    // Create tables if they don't exist
    await createContactsTable();
    await createCallsTable();
    await createMeetingsTable();
    
    // Add missing columns to existing tables
    await addMissingColumnsToContacts();
    await addMissingColumnsToCalls();
    
    // Create sample data if needed
    await createSampleContact();
    await createSampleCall();
    
    log('Database schema fix completed successfully');
  } catch (error) {
    log(`Error fixing database schema: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
