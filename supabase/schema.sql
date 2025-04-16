-- Create schema for Eva CRM with VAPI integration

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create tables
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crm_id VARCHAR,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  email VARCHAR,
  gender VARCHAR,
  location VARCHAR,
  property_interest VARCHAR,
  investment_type VARCHAR,
  budget_range VARCHAR,
  preferred_areas JSONB,
  status VARCHAR,
  priority VARCHAR,
  rating INTEGER,
  ai_sentiment FLOAT,
  ai_notes TEXT,
  source VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_calls INTEGER DEFAULT 0,
  last_contact_date TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  assigned_agent UUID REFERENCES auth.users(id)
);

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retell_call_id VARCHAR UNIQUE,
  lead_id UUID REFERENCES leads(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  call_duration INTEGER,
  call_type VARCHAR,
  call_status VARCHAR,
  audio_url VARCHAR,
  detailed_call_summary TEXT,
  transcript TEXT,
  sentiment_score FLOAT,
  key_topics JSONB,
  next_steps TEXT,
  agent_id UUID REFERENCES auth.users(id)
);

CREATE TABLE active_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  lead_name VARCHAR,
  agent_id UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_leads_crm_id ON leads(crm_id);
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_timestamp ON calls(timestamp);
CREATE INDEX idx_active_calls_status ON active_calls(status);

-- Create or replace function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_calls_updated_at
BEFORE UPDATE ON calls
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to authenticated users" ON calls
FOR ALL TO authenticated
USING (true);

CREATE POLICY "Allow all access to authenticated users" ON leads
FOR ALL TO authenticated
USING (true);

CREATE POLICY "Allow all access to authenticated users" ON active_calls
FOR ALL TO authenticated
USING (true);

-- Insert sample data
INSERT INTO leads (name, email, phone, status, source, notes)
VALUES 
  ('John Smith', 'john.smith@example.com', '+19876543210', 'new', 'website', 'Interested in a 3-bedroom apartment'),
  ('Sarah Johnson', 'sarah.j@example.com', '+18765432109', 'contacted', 'referral', 'Looking for investment property'),
  ('Michael Brown', 'michael.b@example.com', '+17654321098', 'qualified', 'social media', 'Wants to view properties next week');
