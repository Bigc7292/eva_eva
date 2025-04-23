-- Create a table for storing Google Calendar OAuth tokens
CREATE TABLE IF NOT EXISTS user_calendar_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_calendar_tokens_user_id ON user_calendar_tokens(user_id);

-- Enable RLS
ALTER TABLE user_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Users can only access their own tokens"
  ON user_calendar_tokens
  FOR ALL
  USING (auth.uid() = user_id);
