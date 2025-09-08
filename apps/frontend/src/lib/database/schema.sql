-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS lead_profiles CASCADE;

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    call_id TEXT NOT NULL,
    status TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    customer_phone TEXT NOT NULL,
    call_type TEXT NOT NULL,
    call_duration INTEGER,
    agent_id UUID,
    agent_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create lead_profiles table
CREATE TABLE IF NOT EXISTS lead_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone TEXT NOT NULL,
    first_contact_date TIMESTAMP WITH TIME ZONE NOT NULL,
    successful_meetings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON calls;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON calls;
DROP POLICY IF EXISTS "Enable read access for all users" ON lead_profiles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON lead_profiles;

-- Create policies for calls table
CREATE POLICY "Enable read access for all users"
    ON calls FOR SELECT
    USING (true);

CREATE POLICY "Enable insert access for authenticated users"
    ON calls FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create policies for lead_profiles table
CREATE POLICY "Enable read access for all users"
    ON lead_profiles FOR SELECT
    USING (true);

CREATE POLICY "Enable insert access for authenticated users"
    ON lead_profiles FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamp updates
CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_profiles_updated_at
    BEFORE UPDATE ON lead_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert test data
INSERT INTO calls (call_id, status, start_time, customer_phone, call_type)
VALUES 
    ('test-call-1', 'completed', NOW() - INTERVAL '1 hour', '+1234567890', 'outbound'),
    ('test-call-2', 'missed', NOW() - INTERVAL '30 minutes', '+0987654321', 'inbound');

INSERT INTO lead_profiles (phone, first_contact_date)
VALUES 
    ('+1234567890', NOW() - INTERVAL '1 day'),
    ('+0987654321', NOW() - INTERVAL '2 days');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable RLS for all future tables
ALTER DEFAULT PRIVILEGES FOR ROLE authenticated IN SCHEMA public
    GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE authenticated IN SCHEMA public
    GRANT INSERT ON TABLES TO authenticated;
