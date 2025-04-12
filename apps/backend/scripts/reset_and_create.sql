-- Drop existing table and recreate
DROP TABLE IF EXISTS leads CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the leads table
CREATE TABLE leads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  crm_id VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR NOT NULL,
  gender VARCHAR CHECK (gender IN ('Male', 'Female', 'Other')),
  location VARCHAR,
  property_interest VARCHAR CHECK (property_interest IN ('Off-plan', 'Secondary', 'Both', 'Unknown')),
  investment_type VARCHAR CHECK (investment_type IN ('Investment', 'Personal Use')),
  budget_range VARCHAR,
  preferred_areas TEXT[],
  status VARCHAR CHECK (status IN ('New', 'Follow-up', 'Interested', 'Not Interested', 'No Answer', 'Callback')),
  priority VARCHAR CHECK (priority IN ('High', 'Medium', 'Low')),
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  ai_sentiment FLOAT CHECK (ai_sentiment >= 0 AND ai_sentiment <= 1),
  ai_notes TEXT,
  source VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX leads_crm_id_idx ON leads(crm_id);
CREATE INDEX leads_email_idx ON leads(email);
CREATE INDEX leads_phone_idx ON leads(phone);
CREATE INDEX leads_status_idx ON leads(status);

-- Enable row level security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Enable read access for all users" ON leads
  FOR SELECT
  USING (true); 