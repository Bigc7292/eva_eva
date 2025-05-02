/**
 * Script to fix database schema and synchronize Vapi call data
 * This script will:
 * 1. Check the database schema and create/update tables as needed
 * 2. Fetch all calls from Vapi
 * 3. Store them in the calls table
 * 4. Update profiles with call data
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Vapi configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_API_KEY = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logging function
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
 * Check if a table exists
 * @param {string} tableName - Table name to check
 * @returns {Promise<boolean>} - True if table exists
 */
async function tableExists(tableName) {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `;
    
    const { data, error } = await supabase.from('_temp_query').select().sql(query);
    
    if (error) {
      throw error;
    }
    
    return data && data.length > 0 && data[0].exists;
  } catch (error) {
    log(`Error checking if table ${tableName} exists: ${error.message}`);
    return false;
  }
}

/**
 * Get table columns
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} - Array of column names
 */
async function getTableColumns(tableName) {
  try {
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${tableName}';
    `;
    
    const { data, error } = await supabase.from('_temp_query').select().sql(query);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    log(`Error getting columns for table ${tableName}: ${error.message}`);
    return [];
  }
}

/**
 * Fix database schema
 * @returns {Promise<boolean>} - Success status
 */
async function fixDatabaseSchema() {
  try {
    log('Checking and fixing database schema...');
    
    // Check if calls table exists
    const callsExists = await tableExists('calls');
    
    if (!callsExists) {
      log('Creating calls table...');
      
      // Create calls table
      await supabase.from('_temp_query').select().sql(`
        CREATE TABLE calls (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          call_id TEXT NOT NULL,
          contact_id UUID,
          phone_number TEXT,
          call_type TEXT,
          call_status TEXT,
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          duration INTEGER,
          recording_url TEXT,
          transcript TEXT,
          summary TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      log('Calls table created successfully');
    } else {
      // Check if calls table has all required columns
      const callsColumns = await getTableColumns('calls');
      const columnNames = callsColumns.map(col => col.column_name);
      
      log(`Existing columns in calls table: ${columnNames.join(', ')}`);
      
      // Check for missing columns
      const requiredColumns = [
        { name: 'call_id', type: 'text' },
        { name: 'contact_id', type: 'uuid' },
        { name: 'phone_number', type: 'text' },
        { name: 'call_type', type: 'text' },
        { name: 'call_status', type: 'text' },
        { name: 'start_time', type: 'timestamp with time zone' },
        { name: 'end_time', type: 'timestamp with time zone' },
        { name: 'duration', type: 'integer' },
        { name: 'recording_url', type: 'text' },
        { name: 'transcript', type: 'text' },
        { name: 'summary', type: 'text' },
        { name: 'metadata', type: 'jsonb' },
        { name: 'created_at', type: 'timestamp with time zone' },
        { name: 'updated_at', type: 'timestamp with time zone' }
      ];
      
      for (const column of requiredColumns) {
        if (!columnNames.includes(column.name)) {
          log(`Adding missing column ${column.name} to calls table...`);
          
          await supabase.from('_temp_query').select().sql(`
            ALTER TABLE calls ADD COLUMN ${column.name} ${column.type};
          `);
          
          log(`Added column ${column.name} to calls table`);
        }
      }
    }
    
    // Check if contacts table exists
    const contactsExists = await tableExists('contacts');
    
    if (!contactsExists) {
      log('Creating contacts table...');
      
      // Create contacts table
      await supabase.from('_temp_query').select().sql(`
        CREATE TABLE contacts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT,
          profile_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          transcripts JSONB DEFAULT '[]',
          summaries JSONB DEFAULT '[]',
          audio_files JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      log('Contacts table created successfully');
    }
    
    log('Database schema fixed successfully');
    return true;
  } catch (error) {
    log(`Error fixing database schema: ${error.message}`);
    return false;
  }
}

/**
 * Fetch all calls from Vapi
 * @param {number} limit - Number of calls to fetch per page
 * @returns {Promise<Array>} - Array of calls
 */
async function fetchAllCalls(limit = 100) {
  try {
    const url = `${VAPI_API_URL}/call?limit=${limit}`;
    log(`Fetching calls from Vapi: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch calls: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Return the calls array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log(`Error fetching calls: ${error.message}`);
    return [];
  }
}

/**
 * Process a call and store it in the database
 * @param {Object} call - Call data from Vapi
 * @returns {Promise<boolean>} - Success status
 */
async function processCall(call) {
  try {
    log(`Processing call ${call.id}...`);

    // Extract relevant data
    const callId = call.id;
    const phoneNumber = call.customer?.number || 'Unknown';
    const callType = call.type === 'outboundPhoneCall' ? 'Outbound' : 'Inbound';
    const callStatus = call.status || 'Unknown';
    const startTime = call.startedAt || call.createdAt || new Date().toISOString();
    const endTime = call.endedAt || null;
    const duration = call.duration || 0;
    const recordingUrl = call.recordingUrl || call.artifact?.recording || call.artifact?.recordingUrl || null;
    const transcript = call.transcript || call.artifact?.transcript || null;
    const summary = call.summary || call.analysis?.summary || null;

    // Check if the call already exists in the database
    const { data: existingCall, error: existingCallError } = await supabase
      .from('calls')
      .select('*')
      .eq('call_id', callId)
      .maybeSingle();

    if (existingCallError) {
      log(`Error checking if call ${callId} exists: ${existingCallError.message}`);
      return false;
    }

    // Find contact by phone number
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, phone_number')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (contactError) {
      log(`Error finding contact for phone ${phoneNumber}: ${contactError.message}`);
    }

    // Prepare call data for upsert
    const callData = {
      call_id: callId,
      phone_number: phoneNumber,
      call_type: callType,
      call_status: callStatus,
      start_time: startTime,
      end_time: endTime,
      duration: duration,
      recording_url: recordingUrl,
      transcript: transcript,
      summary: summary,
      metadata: call,
      updated_at: new Date().toISOString()
    };

    // Add contact_id if found
    if (contact?.id) {
      callData.contact_id = contact.id;
    }

    // If the call exists, update it
    if (existingCall) {
      log(`Updating existing call ${callId}...`);
      
      const { error: updateError } = await supabase
        .from('calls')
        .update(callData)
        .eq('call_id', callId);

      if (updateError) {
        log(`Error updating call ${callId}: ${updateError.message}`);
        return false;
      }
    } else {
      // Otherwise, insert a new call
      log(`Inserting new call ${callId}...`);
      
      const { error: insertError } = await supabase
        .from('calls')
        .insert([callData]);

      if (insertError) {
        log(`Error inserting call ${callId}: ${insertError.message}`);
        return false;
      }
    }

    // Update contact profile if we have a contact
    if (contact?.id) {
      await updateContactProfile(contact.id);
    } else if (phoneNumber !== 'Unknown') {
      // Create a new contact if we don't have one
      const contactName = call.customer?.name || `Contact ${phoneNumber}`;
      
      const { data: newContact, error: createContactError } = await supabase
        .from('contacts')
        .insert([{
          name: contactName,
          phone_number: phoneNumber,
          profile_created_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createContactError) {
        log(`Error creating contact for phone ${phoneNumber}: ${createContactError.message}`);
      } else {
        log(`Created new contact for phone ${phoneNumber}`);
        await updateContactProfile(newContact.id);
      }
    }

    log(`Successfully processed call ${callId}`);
    return true;
  } catch (error) {
    log(`Error processing call ${call.id}: ${error.message}`);
    return false;
  }
}

/**
 * Update a contact profile with call data
 * @param {string} contactId - Contact ID
 * @returns {Promise<boolean>} - Success status
 */
async function updateContactProfile(contactId) {
  try {
    log(`Updating profile for contact ${contactId}...`);

    // Get all calls for the contact
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('contact_id', contactId)
      .order('start_time', { ascending: false });

    if (callsError) {
      throw callsError;
    }

    if (!calls || calls.length === 0) {
      log(`No calls found for contact ${contactId}`);
      return false;
    }

    log(`Found ${calls.length} calls for contact ${contactId}`);

    // Extract transcripts, summaries, and audio files from calls
    const transcripts = [];
    const summaries = [];
    const audioFiles = [];
    let totalCalls = 0;
    let answeredCalls = 0;
    let missedCalls = 0;
    let totalDuration = 0;

    // Process each call
    for (const call of calls) {
      totalCalls++;

      // Count answered and missed calls
      const status = String(call.call_status || '').toLowerCase();
      if (status === 'completed' || status === 'answered' || status === 'ended') {
        answeredCalls++;
        if (call.duration) {
          totalDuration += call.duration;
        }
      } else if (status === 'missed' || status === 'no-answer' || status === 'no answer') {
        missedCalls++;
      }

      // Add transcript if available
      if (call.transcript) {
        transcripts.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          text: call.transcript
        });
      }

      // Add summary if available
      if (call.summary) {
        summaries.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          text: call.summary
        });
      }

      // Add audio file if available
      if (call.recording_url) {
        audioFiles.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          url: call.recording_url
        });
      }
    }

    // Calculate average call duration
    const avgDuration = answeredCalls > 0 ? Math.round(totalDuration / answeredCalls) : 0;

    // Update contact profile
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        transcripts: transcripts,
        summaries: summaries,
        audio_files: audioFiles,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (updateError) {
      throw updateError;
    }

    log(`Successfully updated profile for contact ${contactId}`);
    log(`Added ${transcripts.length} transcripts, ${summaries.length} summaries, ${audioFiles.length} audio files`);
    log(`Updated call stats: ${totalCalls} total, ${answeredCalls} answered, ${missedCalls} missed, ${avgDuration}s avg duration`);

    return true;
  } catch (error) {
    log(`Error updating profile for contact ${contactId}: ${error.message}`);
    return false;
  }
}

/**
 * Process calls in batches
 * @param {Array} calls - Array of calls to process
 * @param {number} batchSize - Number of calls to process in each batch
 * @returns {Promise<void>}
 */
async function processBatchOfCalls(calls, batchSize = 5) {
  const totalCalls = calls.length;
  let processedCount = 0;
  let successCount = 0;

  // Process calls in batches to avoid rate limiting
  for (let i = 0; i < totalCalls; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalCalls / batchSize)} (${batch.length} calls)`);

    // Process each call in the batch
    for (const call of batch) {
      const success = await processCall(call);
      processedCount++;
      if (success) successCount++;

      // Log progress
      const progressPercent = Math.round((processedCount / totalCalls) * 100);
      log(`Progress: ${processedCount}/${totalCalls} (${progressPercent}%) - Success: ${successCount}`);

      // Add a small delay between calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Add a delay between batches to avoid rate limiting
    if (i + batchSize < totalCalls) {
      log("Waiting 5 seconds before processing next batch...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting database fix and Vapi call synchronization...');

    // Fix database schema
    const schemaFixed = await fixDatabaseSchema();
    if (!schemaFixed) {
      log('Failed to fix database schema, aborting');
      return;
    }

    // Fetch all calls from Vapi
    const calls = await fetchAllCalls(100);
    log(`Retrieved ${calls.length} calls from Vapi`);

    if (calls.length === 0) {
      log('No calls to process');
      return;
    }

    // Process calls in batches
    await processBatchOfCalls(calls, 5);

    log('Vapi call synchronization completed successfully');
  } catch (error) {
    log(`Error synchronizing Vapi calls: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
