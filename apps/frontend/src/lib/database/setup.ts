import { supabase } from '@/lib/supabase'

export async function setupDatabase() {
  try {
    // No schema creation here! Tables and policies must be managed in Supabase SQL editor.
    // Only insert sample data if needed (optional, can be kept if you want test data)
    await insertSampleData();
    console.log('Database setup completed successfully (schema managed in Supabase dashboard)');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

async function insertSampleData() {
  try {
    // Check if we already have data in contacts table
    const { count, error: countError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error checking for existing contacts data:', countError)
      return
    }

    // Only insert sample data if we don't have any contacts yet
    if (count === 0) {
      // Insert sample contacts
      const { error: contactsError } = await supabase
        .from('contacts')
        .insert([
          {
            name: 'John Smith',
            phone_number: '+1234567890',
            email: 'john.smith@example.com',
            interests: 'Off-plan',
            notes: 'Looking for investment property'
          },
          {
            name: 'Sarah Johnson',
            phone_number: '+9876543210',
            email: 'sarah.j@example.com',
            interests: 'Secondary',
            notes: 'Interested in beachfront properties'
          },
          {
            name: 'Mohammed Al Farsi',
            phone_number: '+971565401583',
            email: 'mohammed.f@example.com',
            interests: 'Both',
            notes: 'Looking for both investment and personal use'
          }
        ])

      if (contactsError) {
        console.error('Error inserting sample contacts:', contactsError)
        return
      }

      console.log('Inserted sample contacts')

      // Get the inserted contacts to create calls
      const { data: contacts, error: fetchError } = await supabase
        .from('contacts')
        .select('*')

      if (fetchError || !contacts) {
        console.error('Error fetching inserted contacts:', fetchError)
        return
      }

      console.log('Successfully fetched contacts')

      // Insert sample calls
      const sampleCalls = [
        {
          call_id: 'vapi_call_001',
          contact_id: contacts.find(c => c.phone_number === '+971565401583')?.contact_id,
          phone_number: '+971565401583',
          call_type: 'Outbound',
          call_status: 'Completed',
          call_outcome: 'Interested',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 300000).toISOString(),
          call_duration: 300,
          recording_url: 'https://example.com/recording1.mp3',
          transcript: 'Sample transcript for call 1',
          summary: 'Customer expressed interest in properties in Dubai Marina',
          metadata: { agent_id: 'cfaa163c-4a47-471b-a39e-95c12d0cb738', agent_name: 'Top Loader AI Agent' }
        },
        {
          call_id: 'vapi_call_002',
          contact_id: contacts.find(c => c.phone_number === '+1234567890')?.contact_id,
          phone_number: '+1234567890',
          call_type: 'Outbound',
          call_status: 'Missed',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { agent_id: 'cfaa163c-4a47-471b-a39e-95c12d0cb738', agent_name: 'Top Loader AI Agent' }
        },
        {
          call_id: 'vapi_call_003',
          contact_id: contacts.find(c => c.phone_number === '+9876543210')?.contact_id,
          phone_number: '+9876543210',
          call_type: 'Outbound',
          call_status: 'Completed',
          call_outcome: 'Call Back Later',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 240000).toISOString(),
          call_duration: 240,
          recording_url: 'https://example.com/recording3.mp3',
          transcript: 'Sample transcript for call 3',
          summary: 'Customer requested a callback next week',
          callback_scheduled: true,
          callback_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { agent_id: 'cfaa163c-4a47-471b-a39e-95c12d0cb738', agent_name: 'Top Loader AI Agent' }
        }
      ]

      const { error: callsError } = await supabase
        .from('calls')
        .insert(sampleCalls)

      if (callsError) {
        console.error('Error inserting sample calls:', callsError)
        return
      }

      console.log('Inserted sample calls')

      console.log('Sample calls prepared')
    } else {
      console.log(`Skipping sample data insertion, ${count} contacts already exist`)
    }
  } catch (error) {
    console.error('Error inserting sample data:', error)
  }
}

// RLS policies and table creation should be set up in the Supabase SQL dashboard, not in code.
// This function is now a no-op.
async function setupRLSPolicies() {
  console.log('RLS policies should be managed in Supabase SQL dashboard.');
  return;
}

// Run the setup when this file is imported
setupDatabase().catch(console.error)
