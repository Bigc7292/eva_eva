-- Drop existing table and triggers if they exist
DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS calls;

-- Create the calls table
CREATE TABLE calls (
    id BIGSERIAL PRIMARY KEY,
    call_id TEXT UNIQUE NOT NULL,
    call_type TEXT NOT NULL DEFAULT 'outbound',  -- 'outbound' or 'inbound'
    status TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    customer_phone TEXT,
    customer_name TEXT,
    agent_id TEXT,
    recording_url TEXT,
    transcript TEXT,
    property_interest TEXT,    -- 'Off-plan' or 'Secondary'
    lead_status TEXT,         -- For tracking lead status
    rating INTEGER,           -- Rating out of 5
    notes TEXT,              -- Call notes
    callback_scheduled TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX calls_call_id_idx ON calls(call_id);
CREATE INDEX calls_call_type_idx ON calls(call_type);
CREATE INDEX calls_start_time_idx ON calls(start_time);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 