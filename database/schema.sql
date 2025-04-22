CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  profile_created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  transcripts JSONB DEFAULT '[]',
  summaries JSONB DEFAULT '[]',
  audio_files JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS calls (
  call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  call_type TEXT,
  call_status TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS scheduled_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT,
  call_id UUID,
  metadata JSONB
);
