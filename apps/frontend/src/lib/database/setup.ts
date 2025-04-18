import { supabase } from '@/lib/supabase'

export async function setupDatabase() {
  try {
    // Check if tables exist
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      throw tablesError
    }

    const tables = tablesData?.map(t => t.tablename) || []
    console.log('Existing tables:', tables)

    // Create leads table if it doesn't exist
    if (!tables.includes('leads')) {
      const { error: leadsError } = await supabase.query(`
        CREATE TABLE leads (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR NOT NULL,
          phone VARCHAR UNIQUE NOT NULL,
          email VARCHAR,
          status VARCHAR DEFAULT 'new',
          property_interest VARCHAR,
          budget DECIMAL(10, 2),
          location VARCHAR,
          nationality VARCHAR,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      if (leadsError) {
        console.error('Error creating leads table:', leadsError)
        throw leadsError
      }
      console.log('Created leads table')
    }

    // Create calls table if it doesn't exist
    if (!tables.includes('calls')) {
      const { error: callsError } = await supabase.query(`
        CREATE TABLE calls (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          call_id VARCHAR UNIQUE NOT NULL,
          lead_id UUID REFERENCES leads(id),
          phone_number VARCHAR NOT NULL,
          call_type VARCHAR NOT NULL CHECK (call_type IN ('Inbound', 'Outbound')),
          call_status VARCHAR NOT NULL CHECK (call_status IN ('Completed', 'Answered', 'Missed', 'No Answer', 'Voicemail', 'Failed')),
          call_outcome VARCHAR,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          end_time TIMESTAMP WITH TIME ZONE,
          call_duration INTEGER,
          recording_url VARCHAR,
          transcript TEXT,
          summary TEXT,
          metadata JSONB,
          meeting_scheduled BOOLEAN DEFAULT FALSE,
          meeting_time TIMESTAMP WITH TIME ZONE,
          callback_scheduled BOOLEAN DEFAULT FALSE,
          callback_time TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      if (callsError) {
        console.error('Error creating calls table:', callsError)
        throw callsError
      }
      console.log('Created calls table')
    }

    // Create lead_profiles table if it doesn't exist
    if (!tables.includes('lead_profiles')) {
      const { error: profilesError } = await supabase.query(`
        CREATE TABLE lead_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          lead_id UUID REFERENCES leads(id),
          phone VARCHAR NOT NULL,
          first_contact_date TIMESTAMP WITH TIME ZONE,
          successful_meetings INTEGER DEFAULT 0,
          total_calls INTEGER DEFAULT 0,
          answered_calls INTEGER DEFAULT 0,
          missed_calls INTEGER DEFAULT 0,
          last_call_date TIMESTAMP WITH TIME ZONE,
          last_call_status VARCHAR,
          callback_date TIMESTAMP WITH TIME ZONE,
          interest_level VARCHAR CHECK (interest_level IN ('High', 'Medium', 'Low', 'Unknown')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES leads(id)
        )
      `)

      if (profilesError) {
        console.error('Error creating lead_profiles table:', profilesError)
        throw profilesError
      }
      console.log('Created lead_profiles table')
    }

    // Create meetings table if it doesn't exist
    if (!tables.includes('meetings')) {
      const { error: meetingsError } = await supabase.query(`
        CREATE TABLE meetings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          lead_id UUID REFERENCES leads(id),
          call_id UUID REFERENCES calls(id),
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          location VARCHAR,
          property_type VARCHAR,
          budget DECIMAL(10, 2),
          notes TEXT,
          status VARCHAR CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      if (meetingsError) {
        console.error('Error creating meetings table:', meetingsError)
        throw meetingsError
      }
      console.log('Created meetings table')
    }

    // Insert sample data for testing
    await insertSampleData()

    // Set up RLS policies
    await setupRLSPolicies()

    console.log('Database setup completed successfully')
    return true
  } catch (error) {
    console.error('Error setting up database:', error)
    throw error
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

async function setupRLSPolicies() {
  try {
    // Enable RLS on tables
    await supabase.query(`
      ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
      ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
      ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
    `)

    // Create policies for authenticated users
    await supabase.query(`
      -- Leads policies
      CREATE POLICY IF NOT EXISTS "Authenticated users can read leads"
        ON leads FOR SELECT
        USING (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Authenticated users can insert leads"
        ON leads FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Authenticated users can update leads"
        ON leads FOR UPDATE
        USING (auth.role() = 'authenticated');

      -- Calls policies
      CREATE POLICY IF NOT EXISTS "Authenticated users can read calls"
        ON calls FOR SELECT
        USING (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Authenticated users can insert calls"
        ON calls FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Authenticated users can update calls"
        ON calls FOR UPDATE
        USING (auth.role() = 'authenticated');

      -- Lead profiles policies
      CREATE POLICY IF NOT EXISTS "Authenticated users can read lead profiles"
        ON lead_profiles FOR SELECT
        USING (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Authenticated users can insert lead profiles"
        ON lead_profiles FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Authenticated users can update lead profiles"
        ON lead_profiles FOR UPDATE
        USING (auth.role() = 'authenticated');

      -- Meetings policies
      CREATE POLICY IF NOT EXISTS "Authenticated users can read meetings"
        ON meetings FOR SELECT
        USING (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Authenticated users can insert meetings"
        ON meetings FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Authenticated users can update meetings"
        ON meetings FOR UPDATE
        USING (auth.role() = 'authenticated');
    `)

    console.log('RLS policies set up successfully')
  } catch (error) {
    console.error('Error setting up RLS policies:', error)
    throw error
  }
}

// Run the setup when this file is imported
setupDatabase().catch(console.error)
