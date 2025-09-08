-- First, do a complete cleanup
BEGIN;

-- Drop existing table and dependencies
DROP TABLE IF EXISTS calls CASCADE;

-- Create the calls table
CREATE TABLE calls (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  retell_call_id varchar NOT NULL UNIQUE,
  timestamp timestamptz NOT NULL,
  call_duration interval,
  call_type varchar CHECK (call_type IN ('Inbound', 'Outbound')),
  call_status varchar CHECK (call_status IN ('Completed', 'No Answer', 'Busy', 'Rejected', 'Missed', 'Voicemail')),
  user_name varchar,
  user_phone varchar,
  detailed_call_summary text,
  audio_url varchar,
  property_interest varchar,
  status varchar,
  rating integer CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Create useful indexes
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_timestamp ON calls(timestamp);
CREATE INDEX idx_calls_call_status ON calls(call_status);
CREATE INDEX idx_calls_call_type ON calls(call_type);
CREATE INDEX idx_calls_user_phone ON calls(user_phone);

-- Enable RLS but make it fully public
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON calls;
CREATE POLICY "Public Access" ON calls FOR ALL USING (true);

-- Insert test data
INSERT INTO calls (
  lead_id,
  retell_call_id,
  timestamp,
  call_duration,
  call_type,
  call_status,
  user_name,
  user_phone,
  detailed_call_summary,
  audio_url,
  property_interest,
  status,
  rating
)
VALUES 
-- Inbound Calls
(
  '8d115968-1613-457d-a274-4809213db80e',
  'call1',
  '2024-02-13 05:08:15',
  '03:12:00',
  'Inbound',
  'Completed',
  'Ahmed Khan',
  '+971501234567',
  'User exploring luxury properties in Dubai Marina. Very interested in 3BR apartments.',
  'https://example.com/call1.mp3',
  'Off-plan',
  'Interested',
  5
),
(
  '3f3f9fa5-8227-4b5a-9af2-650ae7fe0f6a',
  'call2',
  '2024-02-13 05:14:47',
  '00:00:00',
  'Inbound',
  'Missed',
  'Sarah Wilson',
  '+971502345678',
  'Missed call - attempt to call back',
  'https://example.com/call2.mp3',
  'Secondary',
  'No Answer',
  0
),
-- Outbound Calls
(
  'a075ba83-45e3-4e84-803b-23ae07bc3659',
  'call3',
  '2024-02-13 04:02:47',
  '22:08:00',
  'Outbound',
  'Completed',
  'Mohammed Ali',
  '+971503456789',
  'Detailed discussion about investment opportunities. Interested in both off-plan and secondary properties.',
  'https://example.com/call3.mp3',
  'Both',
  'Interested',
  4
),
(
  '8d115968-1613-457d-a274-4809213db80e',
  'call4',
  '2024-02-13 06:30:00',
  '00:00:00',
  'Outbound',
  'No Answer',
  'Ahmed Khan',
  '+971501234567',
  'Follow-up call attempted - no answer',
  'https://example.com/call4.mp3',
  'Off-plan',
  'No Answer',
  3
);

-- Grant public access
GRANT ALL ON calls TO anon;
GRANT ALL ON calls TO authenticated;
GRANT ALL ON calls TO service_role;

-- Enable realtime subscriptions for the calls table
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

COMMIT; 