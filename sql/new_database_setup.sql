-- Complete Database Setup Script
-- This script will create all necessary tables, functions, and views
-- and ensure the lead profile for +971565401583 exists

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects to start fresh
DROP VIEW IF EXISTS call_outcome_metrics CASCADE;
DROP VIEW IF EXISTS lead_engagement_metrics CASCADE;
DROP VIEW IF EXISTS call_status_metrics CASCADE;
DROP VIEW IF EXISTS call_metrics CASCADE;
DROP VIEW IF EXISTS meeting_metrics CASCADE;
DROP FUNCTION IF EXISTS get_answered_calls_per_day() CASCADE;
DROP FUNCTION IF EXISTS get_meeting_locations_count() CASCADE;
DROP TABLE IF EXISTS call_analytics CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
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
  answered_calls INTEGER DEFAULT 0,
  missed_calls INTEGER DEFAULT 0,
  last_call_date TIMESTAMP WITH TIME ZONE,
  last_call_status VARCHAR,
  callback_date TIMESTAMP WITH TIME ZONE,
  interest_level VARCHAR,
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
  call_status VARCHAR NOT NULL CHECK (call_status IN ('Completed', 'Answered', 'Missed', 'No Answer', 'Busy', 'Voicemail', 'Failed', 'Rejected')),
  call_outcome VARCHAR CHECK (call_outcome IN ('Interested', 'Not Interested', 'Call Back Later', 'No Decision', 'Meeting Scheduled', 'Information Provided')),
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

-- Create meetings table
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
  outcome VARCHAR,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_analytics table
CREATE TABLE call_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  answered_calls INTEGER DEFAULT 0,
  missed_calls INTEGER DEFAULT 0,
  voicemail_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  avg_duration DECIMAL(10, 2) DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  meetings_scheduled INTEGER DEFAULT 0,
  callbacks_scheduled INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Create indexes for better performance
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_lead_profiles_phone ON lead_profiles(phone);
CREATE INDEX idx_lead_profiles_lead_id ON lead_profiles(lead_id);
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_phone_number ON calls(phone_number);
CREATE INDEX idx_calls_timestamp ON calls(timestamp);
CREATE INDEX idx_calls_call_status ON calls(call_status);
CREATE INDEX idx_calls_call_outcome ON calls(call_outcome);
CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX idx_meetings_timestamp ON meetings(timestamp);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_call_analytics_date ON call_analytics(date);

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

CREATE TRIGGER update_call_analytics_updated_at
BEFORE UPDATE ON call_analytics
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

-- Create the call_status_metrics view
CREATE OR REPLACE VIEW call_status_metrics AS
SELECT
    call_status,
    COUNT(*) as count,
    ROUND((COUNT(*)::float / (SELECT COUNT(*) FROM calls)::float) * 100, 2) as percentage,
    AVG(call_duration) as avg_duration,
    MIN(timestamp) as first_call,
    MAX(timestamp) as last_call
FROM
    calls
GROUP BY
    call_status
ORDER BY
    count DESC;

-- Create the lead_engagement_metrics view
CREATE OR REPLACE VIEW lead_engagement_metrics AS
SELECT
    l.id as lead_id,
    l.name,
    l.phone,
    COUNT(c.id) as total_calls,
    SUM(CASE WHEN c.call_status = 'Completed' OR c.call_status = 'Answered' THEN 1 ELSE 0 END) as answered_calls,
    SUM(CASE WHEN c.call_status = 'Missed' OR c.call_status = 'No Answer' THEN 1 ELSE 0 END) as missed_calls,
    COUNT(m.id) as total_meetings,
    CASE 
        WHEN COUNT(c.id) > 0 THEN 
            (COUNT(m.id)::float / COUNT(c.id)::float) * 100
        ELSE 0
    END as call_to_meeting_rate,
    MIN(c.timestamp) as first_contact,
    MAX(c.timestamp) as last_contact,
    EXTRACT(EPOCH FROM (MAX(c.timestamp) - MIN(c.timestamp))) / 86400 as days_in_pipeline
FROM
    leads l
LEFT JOIN
    calls c ON l.id = c.lead_id
LEFT JOIN
    meetings m ON l.id = m.lead_id
GROUP BY
    l.id, l.name, l.phone
ORDER BY
    total_calls DESC;

-- Create the call_outcome_metrics view
CREATE OR REPLACE VIEW call_outcome_metrics AS
SELECT
    call_outcome,
    COUNT(*) as count,
    ROUND((COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM calls WHERE call_outcome IS NOT NULL), 0)::float) * 100, 2) as percentage,
    AVG(call_duration) as avg_duration,
    COUNT(CASE WHEN meeting_scheduled THEN 1 END) as meetings_scheduled,
    COUNT(CASE WHEN callback_scheduled THEN 1 END) as callbacks_scheduled
FROM
    calls
WHERE
    call_outcome IS NOT NULL
GROUP BY
    call_outcome
ORDER BY
    count DESC;

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
    answered_calls,
    missed_calls,
    interest_level,
    created_at,
    updated_at
  ) VALUES (
    colin_lead_id,
    '+971565401583',
    NOW(),
    0,
    0,
    0,
    0,
    'High',
    NOW(),
    NOW()
  ) ON CONFLICT (phone) DO NOTHING;
  
  -- Insert sample calls if none exist
  IF NOT EXISTS (SELECT 1 FROM calls WHERE phone_number = '+971565401583') THEN
    -- Sample completed call
    INSERT INTO calls (
      call_id,
      lead_id,
      phone_number,
      call_type,
      call_status,
      call_outcome,
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
      'Interested',
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days' + INTERVAL '2 minutes',
      120,
      'https://storage.vapi.ai/sample-recording-1.mp3',
      'This is a sample transcript for a completed call. The customer expressed interest in investment properties in Dubai.',
      'Sample call summary: The customer expressed interest in investment properties in Dubai, particularly in the downtown area. Budget range is around 1-2 million AED.',
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days'
    );
    
    -- Sample missed call
    INSERT INTO calls (
      call_id,
      lead_id,
      phone_number,
      call_type,
      call_status,
      timestamp,
      created_at,
      updated_at
    ) VALUES (
      'sample-call-' || uuid_generate_v4(),
      colin_lead_id,
      '+971565401583',
      'Outbound',
      'No Answer',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days'
    );
    
    -- Sample call with meeting scheduled
    INSERT INTO calls (
      call_id,
      lead_id,
      phone_number,
      call_type,
      call_status,
      call_outcome,
      timestamp,
      end_time,
      call_duration,
      recording_url,
      transcript,
      summary,
      meeting_scheduled,
      meeting_time,
      created_at,
      updated_at
    ) VALUES (
      'sample-call-' || uuid_generate_v4(),
      colin_lead_id,
      '+971565401583',
      'Outbound',
      'Completed',
      'Meeting Scheduled',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day' + INTERVAL '3 minutes',
      180,
      'https://storage.vapi.ai/sample-recording-2.mp3',
      'This is a sample transcript for a call where a meeting was scheduled. The customer agreed to meet to discuss investment opportunities.',
      'Sample call summary: The customer agreed to meet to discuss investment opportunities in Dubai Marina. They are looking for a 2-bedroom apartment with a budget of 1.5 million AED.',
      TRUE,
      NOW() + INTERVAL '2 days',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    );
    
    -- Update the lead_profiles
    UPDATE lead_profiles 
    SET total_calls = 3, 
        answered_calls = 2,
        missed_calls = 1,
        last_call_date = NOW() - INTERVAL '1 day',
        last_call_status = 'Completed'
    WHERE phone = '+971565401583';
    
    -- Insert a meeting
    INSERT INTO meetings (
      lead_id,
      call_id,
      timestamp,
      location,
      property_type,
      budget,
      notes,
      status,
      created_at,
      updated_at
    ) VALUES (
      colin_lead_id,
      (SELECT id FROM calls WHERE phone_number = '+971565401583' AND meeting_scheduled = TRUE),
      NOW() + INTERVAL '2 days',
      'Dubai Marina Sales Center',
      'Apartment',
      1500000,
      'Customer interested in 2-bedroom apartments in Dubai Marina for investment purposes.',
      'scheduled',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    );
  END IF;
  
  -- Update call analytics
  INSERT INTO call_analytics (
    date,
    total_calls,
    answered_calls,
    missed_calls,
    voicemail_calls,
    failed_calls,
    avg_duration,
    total_duration,
    meetings_scheduled,
    callbacks_scheduled
  )
  SELECT
    DATE(timestamp),
    COUNT(*),
    SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END),
    SUM(CASE WHEN call_status = 'Missed' OR call_status = 'No Answer' THEN 1 ELSE 0 END),
    SUM(CASE WHEN call_status = 'Voicemail' THEN 1 ELSE 0 END),
    SUM(CASE WHEN call_status = 'Failed' THEN 1 ELSE 0 END),
    CASE 
      WHEN SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END) > 0 THEN 
        ROUND(SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN call_duration ELSE 0 END)::numeric / 
        SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END), 2)
      ELSE 0
    END,
    SUM(COALESCE(call_duration, 0)),
    SUM(CASE WHEN meeting_scheduled THEN 1 ELSE 0 END),
    SUM(CASE WHEN callback_scheduled THEN 1 ELSE 0 END)
  FROM
    calls
  GROUP BY
    DATE(timestamp)
  ON CONFLICT (date) DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    answered_calls = EXCLUDED.answered_calls,
    missed_calls = EXCLUDED.missed_calls,
    voicemail_calls = EXCLUDED.voicemail_calls,
    failed_calls = EXCLUDED.failed_calls,
    avg_duration = EXCLUDED.avg_duration,
    total_duration = EXCLUDED.total_duration,
    meetings_scheduled = EXCLUDED.meetings_scheduled,
    callbacks_scheduled = EXCLUDED.callbacks_scheduled,
    updated_at = NOW();
END $$;
