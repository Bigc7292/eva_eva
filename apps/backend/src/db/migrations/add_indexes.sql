-- Add indexes on foreign keys for better join performance
CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_meetings_contact_id ON meetings(contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_contact_id ON sms(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_notes_contact_id ON notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);

-- Add indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_calls_call_status ON calls(call_status);
CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls(start_time);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_time ON meetings(meeting_time);

-- Add indexes on timestamp columns for time-based queries
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);

-- Add indexes for full-text search on transcripts and summaries
CREATE INDEX IF NOT EXISTS idx_calls_transcript_gin ON calls USING gin(to_tsvector('english', transcript)) WHERE transcript IS NOT NULL AND transcript != '';
CREATE INDEX IF NOT EXISTS idx_calls_summary_gin ON calls USING gin(to_tsvector('english', summary)) WHERE summary IS NOT NULL AND summary != '';

-- Add index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_contacts_call_stats ON contacts USING gin(call_stats);
CREATE INDEX IF NOT EXISTS idx_calls_metadata ON calls USING gin(metadata);
