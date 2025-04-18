-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
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
);

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
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
);

-- Create lead_profiles table
CREATE TABLE IF NOT EXISTS lead_profiles (
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
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
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
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read leads" ON leads;
CREATE POLICY "Authenticated users can read leads"
  ON leads FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
CREATE POLICY "Authenticated users can insert leads"
  ON leads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read calls" ON calls;
CREATE POLICY "Authenticated users can read calls"
  ON calls FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert calls" ON calls;
CREATE POLICY "Authenticated users can insert calls"
  ON calls FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update calls" ON calls;
CREATE POLICY "Authenticated users can update calls"
  ON calls FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read lead profiles" ON lead_profiles;
CREATE POLICY "Authenticated users can read lead profiles"
  ON lead_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert lead profiles" ON lead_profiles;
CREATE POLICY "Authenticated users can insert lead profiles"
  ON lead_profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update lead profiles" ON lead_profiles;
CREATE POLICY "Authenticated users can update lead profiles"
  ON lead_profiles FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read meetings" ON meetings;
CREATE POLICY "Authenticated users can read meetings"
  ON meetings FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert meetings" ON meetings;
CREATE POLICY "Authenticated users can insert meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update meetings" ON meetings;
CREATE POLICY "Authenticated users can update meetings"
  ON meetings FOR UPDATE
  USING (auth.role() = 'authenticated');
