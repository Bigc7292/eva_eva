const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../frontend/.env.local') });

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Log file path
const logFilePath = path.join(tempDir, 'update-profiles.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

/**
 * Log message to console and file
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

/**
 * Get all contacts
 */
async function getAllContacts() {
  try {
    log('Fetching all contacts...');
    
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    log(`Retrieved ${contacts.length} contacts`);
    return contacts;
  } catch (error) {
    log(`Error fetching contacts: ${error.message}`);
    throw error;
  }
}

/**
 * Get calls for a contact
 */
async function getCallsForContact(contactId) {
  try {
    log(`Fetching calls for contact ${contactId}...`);
    
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('contact_id', contactId);
      
    if (error) {
      throw error;
    }
    
    log(`Retrieved ${calls.length} calls for contact ${contactId}`);
    return calls;
  } catch (error) {
    log(`Error fetching calls for contact ${contactId}: ${error.message}`);
    return [];
  }
}

/**
 * Update contact profile with call data
 */
async function updateContactProfile(contact, calls) {
  try {
    if (!calls || calls.length === 0) {
      log(`No calls to process for contact ${contact.contact_id}`);
      return false;
    }
    
    log(`Updating profile for contact ${contact.contact_id} (${contact.name})...`);
    
    // Extract transcripts, summaries, and audio files from calls
    const transcripts = [];
    const summaries = [];
    const audioFiles = [];
    
    for (const call of calls) {
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
      const audioUrl = call.audio_url || call.recording_url;
      if (audioUrl) {
        audioFiles.push({
          call_id: call.call_id,
          timestamp: call.start_time,
          url: audioUrl
        });
      }
    }
    
    // Update contact profile
    const { error } = await supabase
      .from('contacts')
      .update({
        transcripts: transcripts,
        summaries: summaries,
        audio_files: audioFiles,
        updated_at: new Date().toISOString()
      })
      .eq('contact_id', contact.contact_id);
      
    if (error) {
      throw error;
    }
    
    log(`Successfully updated profile for contact ${contact.contact_id} (${contact.name})`);
    log(`Added ${transcripts.length} transcripts, ${summaries.length} summaries, and ${audioFiles.length} audio files`);
    
    return true;
  } catch (error) {
    log(`Error updating profile for contact ${contact.contact_id}: ${error.message}`);
    return false;
  }
}

/**
 * Main function to update all contact profiles
 */
async function updateAllContactProfiles() {
  try {
    log('Starting contact profile update process...');
    
    // Get all contacts
    const contacts = await getAllContacts();
    
    // Process each contact
    let successCount = 0;
    let errorCount = 0;
    
    for (const contact of contacts) {
      try {
        // Get calls for contact
        const calls = await getCallsForContact(contact.contact_id);
        
        // Update contact profile
        const success = await updateContactProfile(contact, calls);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        log(`Error processing contact ${contact.contact_id}: ${error.message}`);
        errorCount++;
      }
    }
    
    log(`Contact profile update completed. Successfully updated ${successCount} profiles. Errors: ${errorCount}`);
  } catch (error) {
    log(`Error updating contact profiles: ${error.message}`);
  } finally {
    // Close log stream
    logStream.end();
  }
}

// Run the update
updateAllContactProfiles();
