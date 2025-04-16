-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retell_call_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    call_duration INTEGER,
    call_type TEXT CHECK (call_type IN ('Inbound', 'Outbound')),
    call_status TEXT CHECK (call_status IN ('Completed', 'Missed', 'Voicemail')),
    audio_url TEXT,
    detailed_call_summary TEXT,
    lead_id UUID REFERENCES leads(id),
    lead_name TEXT,
    lead_email TEXT,
    lead_phone TEXT,
    transcript TEXT,
    sentiment_score DECIMAL(3,2),
    key_topics TEXT[],
    next_steps TEXT,
    agent_id UUID REFERENCES agents(id),
    agent_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_call_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_call_updated_at();
