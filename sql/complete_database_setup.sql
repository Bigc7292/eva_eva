-- Complete Database Setup Script
-- This script will create all necessary tables, functions, and views
-- and ensure the lead profile for +971565401583 exists

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects to start fresh
DROP VIEW IF EXISTS call_metrics CASCADE;
DROP VIEW IF EXISTS meeting_metrics CASCADE;
DROP FUNCTION IF EXISTS get_answered_calls_per_day() CASCADE;
DROP FUNCTION IF EXISTS get_meeting_locations_count() CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS lead_profiles CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Create leads table
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
);

-- Create lead_profiles table for additional lead information
CREATE TABLE lead_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  phone VARCHAR UNIQUE NOT NULL,
  first_contact_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  successful_meetings INTEGER DEFAULT 0,
  total_calls INTEGER DEFAULT 0,
  last_call_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id VARCHAR UNIQUE NOT NULL,
  lead_id UUID REFERENCES leads(id),
  phone_number VARCHAR NOT NULL,
  call_type VARCHAR NOT NULL CHECK (call_type IN ('Inbound', 'Outbound')),
  call_status VARCHAR NOT NULL CHECK (call_status IN ('Completed', 'Answered', 'Missed', 'No Answer', 'Voicemail', 'Failed')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  call_duration INTEGER,
  recording_url VARCHAR,
  transcript TEXT,
  summary TEXT,
  metadata JSONB,
  meeting_scheduled BOOLEAN DEFAULT FALSE,
  meeting_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR,
  property_type VARCHAR,
  budget DECIMAL(10, 2),
  notes TEXT,
  status VARCHAR CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_lead_profiles_phone ON lead_profiles(phone);
CREATE INDEX idx_lead_profiles_lead_id ON lead_profiles(lead_id);
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_phone_number ON calls(phone_number);
CREATE INDEX idx_calls_timestamp ON calls(timestamp);
CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX idx_meetings_timestamp ON meetings(timestamp);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_profiles_updated_at
BEFORE UPDATE ON lead_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at
BEFORE UPDATE ON calls
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the get_meeting_locations_count function
CREATE OR REPLACE FUNCTION public.get_meeting_locations_count()
RETURNS TABLE (
  location text,
  count bigint
) 
LANGUAGE sql
AS $$
  SELECT 
    location, 
    COUNT(*) as count
  FROM 
    meetings
  WHERE 
    status != 'cancelled'
  GROUP BY 
    location;
$$;

-- Create the get_answered_calls_per_day function
CREATE OR REPLACE FUNCTION public.get_answered_calls_per_day()
RETURNS TABLE (
  call_date date,
  answered_calls bigint
) 
LANGUAGE sql
AS $$
  SELECT 
    DATE(timestamp) as call_date, 
    COUNT(*) as answered_calls
  FROM 
    calls
  WHERE 
    call_status = 'Completed' OR call_status = 'Answered'
  GROUP BY 
    DATE(timestamp)
  ORDER BY 
    call_date;
$$;

-- Create the meeting_metrics view
CREATE OR REPLACE VIEW meeting_metrics AS
SELECT 
    DATE(timestamp) as meeting_date,
    COUNT(*) as total_meetings,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_meetings,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_meetings,
    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_meetings
FROM 
    meetings
GROUP BY 
    DATE(timestamp)
ORDER BY 
    meeting_date;

-- Create the call_metrics view
CREATE OR REPLACE VIEW call_metrics AS
SELECT 
    COUNT(*) as total_calls,
    SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END) as answered_calls,
    SUM(CASE WHEN call_status = 'Missed' OR call_status = 'No Answer' THEN 1 ELSE 0 END) as missed_calls,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            (SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END)::float / COUNT(*)::float) * 100
        ELSE 0
    END as answer_rate,
    CASE 
        WHEN SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END) > 0 THEN 
            SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN call_duration ELSE 0 END)::float / 
            SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END)::float
        ELSE 0
    END as avg_duration
FROM 
    calls;

-- Insert Colin Loader's profile
INSERT INTO leads (
  id,
  name,
  phone,
  email,
  status,
  property_interest,
  nationality,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  'Colin Loader',
  '+971565401583',
  'colin@toploaderagentai.com',
  'new',
  'Investment',
  'British',
  NOW(),
  NOW()
) ON CONFLICT (phone) DO NOTHING;

-- Get the lead ID for Colin Loader
DO $$
DECLARE
  colin_lead_id UUID;
BEGIN
  SELECT id INTO colin_lead_id FROM leads WHERE phone = '+971565401583';
  
  -- Insert into lead_profiles
  INSERT INTO lead_profiles (
    lead_id,
    phone,
    first_contact_date,
    successful_meetings,
    total_calls,
    created_at,
    updated_at
  ) VALUES (
    colin_lead_id,
    '+971565401583',
    NOW(),
    0,
    0,
    NOW(),
    NOW()
  ) ON CONFLICT (phone) DO NOTHING;
  
  -- Insert a sample call if none exists
  IF NOT EXISTS (SELECT 1 FROM calls WHERE phone_number = '+971565401583') THEN
    INSERT INTO calls (
      call_id,
      lead_id,
      phone_number,
      call_type,
      call_status,
      timestamp,
      end_time,
      call_duration,
      recording_url,
      transcript,
      summary,
      created_at,
      updated_at
    ) VALUES (
      'sample-call-' || uuid_generate_v4(),
      colin_lead_id,
      '+971565401583',
      'Outbound',
      'Completed',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day' + INTERVAL '2 minutes',
      120,
      'https://storage.vapi.ai/sample-recording.mp3',
      'This is a sample transcript for testing purposes.',
      'Sample call summary: The customer expressed interest in investment properties in Dubai.',
      NOW(),
      NOW()
    );
    
    -- Update the lead_profiles total_calls and last_call_date
    UPDATE lead_profiles 
    SET total_calls = total_calls + 1, 
        last_call_date = NOW() - INTERVAL '1 day'
    WHERE phone = '+971565401583';
  END IF;
END $$;
