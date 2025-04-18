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
    // Check if we already have data
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error checking for existing data:', countError)
      return
    }

    // Only insert sample data if we don't have any leads yet
    if (count === 0) {
      // Insert sample leads
      const { error: leadsError } = await supabase
        .from('leads')
        .insert([
          {
            name: 'John Smith',
            phone: '+1234567890',
            email: 'john.smith@example.com',
            status: 'new',
            property_interest: 'Off-plan',
            budget: 1500000,
            location: 'Dubai Marina',
            nationality: 'British',
            notes: 'Looking for investment property'
          },
          {
            name: 'Sarah Johnson',
            phone: '+9876543210',
            email: 'sarah.j@example.com',
            status: 'call_back_later',
            property_interest: 'Secondary',
            budget: 2000000,
            location: 'Palm Jumeirah',
            nationality: 'American',
            notes: 'Interested in beachfront properties'
          },
          {
            name: 'Mohammed Al Farsi',
            phone: '+971565401583',
            email: 'mohammed.f@example.com',
            status: 'new',
            property_interest: 'Both',
            budget: 3000000,
            location: 'Downtown Dubai',
            nationality: 'Emirati',
            notes: 'Looking for both investment and personal use'
          }
        ])

      if (leadsError) {
        console.error('Error inserting sample leads:', leadsError)
        return
      }

      console.log('Inserted sample leads')

      // Get the inserted leads to create profiles and calls
      const { data: leads, error: fetchError } = await supabase
        .from('leads')
        .select('*')

      if (fetchError || !leads) {
        console.error('Error fetching inserted leads:', fetchError)
        return
      }

      // Insert lead profiles
      const leadProfiles = leads.map(lead => ({
        lead_id: lead.id,
        phone: lead.phone,
        first_contact_date: new Date().toISOString(),
        total_calls: 0,
        answered_calls: 0,
        missed_calls: 0,
        interest_level: 'Medium'
      }))

      const { error: profilesError } = await supabase
        .from('lead_profiles')
        .insert(leadProfiles)

      if (profilesError) {
        console.error('Error inserting lead profiles:', profilesError)
        return
      }

      console.log('Inserted lead profiles')

      // Insert sample calls
      const sampleCalls = [
        {
          call_id: 'vapi_call_001',
          lead_id: leads.find(l => l.phone === '+971565401583')?.id,
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
          lead_id: leads.find(l => l.phone === '+1234567890')?.id,
          phone_number: '+1234567890',
          call_type: 'Outbound',
          call_status: 'Missed',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { agent_id: 'cfaa163c-4a47-471b-a39e-95c12d0cb738', agent_name: 'Top Loader AI Agent' }
        },
        {
          call_id: 'vapi_call_003',
          lead_id: leads.find(l => l.phone === '+9876543210')?.id,
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

      // Update lead profiles with call data
      for (const lead of leads) {
        const leadCalls = sampleCalls.filter(call => call.lead_id === lead.id)
        if (leadCalls.length > 0) {
          const answeredCalls = leadCalls.filter(call => call.call_status === 'Completed').length
          const missedCalls = leadCalls.filter(call => call.call_status === 'Missed').length

          const { error: updateError } = await supabase
            .from('lead_profiles')
            .update({
              total_calls: leadCalls.length,
              answered_calls: answeredCalls,
              missed_calls: missedCalls,
              last_call_date: leadCalls[0].timestamp,
              last_call_status: leadCalls[0].call_status
            })
            .eq('lead_id', lead.id)

          if (updateError) {
            console.error(`Error updating profile for lead ${lead.id}:`, updateError)
          }
        }
      }

      console.log('Updated lead profiles with call data')
    } else {
      console.log(`Skipping sample data insertion, ${count} leads already exist`)
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
