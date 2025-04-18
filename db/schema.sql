-- Database schema for Call Management Dashboard

-- Leads table
CREATE TABLE leads (
  lead_id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE,
  name VARCHAR(100),
  email VARCHAR(100),
  status VARCHAR(50) CHECK (status IN ('not_interested', 'call_back_later', 'no_answer', 'booked', 'new')),
  last_call_outcome VARCHAR(50),
  total_calls INT DEFAULT 0,
  budget DECIMAL(10, 2),
  property_interest VARCHAR(50) CHECK (property_interest IN ('off_plan', 'secondary', 'both', 'none')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calls table
CREATE TABLE calls (
  call_id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES leads(lead_id),
  call_external_id VARCHAR(100), -- ID from VAPI or other call service
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT, -- in seconds
  answered BOOLEAN DEFAULT FALSE,
  outcome VARCHAR(50) CHECK (outcome IN ('answered', 'not_interested', 'call_back_later', 'no_answer')),
  cost DECIMAL(10, 2),
  recording_url VARCHAR(255),
  transcript TEXT,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meetings table
CREATE TABLE meetings (
  meeting_id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES leads(lead_id),
  timestamp TIMESTAMP,
  location VARCHAR(255),
  property_type VARCHAR(50) CHECK (property_type IN ('off_plan', 'secondary')),
  budget DECIMAL(10, 2),
  notes TEXT,
  status VARCHAR(50) CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_calls_timestamp ON calls(timestamp);
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_meetings_timestamp ON meetings(timestamp);
CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a view for call metrics
CREATE VIEW call_metrics AS
SELECT
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) AS calls_today,
  COUNT(*) FILTER (WHERE timestamp >= DATE_TRUNC('week', CURRENT_DATE)) AS calls_this_week,
  COUNT(*) FILTER (WHERE answered = TRUE) AS total_answered,
  COUNT(*) FILTER (WHERE answered = TRUE AND timestamp >= CURRENT_DATE) AS answered_today,
  COUNT(*) FILTER (WHERE answered = TRUE AND timestamp >= DATE_TRUNC('week', CURRENT_DATE)) AS answered_this_week,
  COALESCE(AVG(duration) FILTER (WHERE answered = TRUE), 0) AS avg_call_duration,
  COALESCE(AVG(cost), 0) AS avg_call_cost
FROM calls;

-- Create a view for meeting metrics
CREATE VIEW meeting_metrics AS
SELECT
  COUNT(*) AS total_meetings,
  COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) AS meetings_today,
  COUNT(*) FILTER (WHERE timestamp >= DATE_TRUNC('week', CURRENT_DATE)) AS meetings_this_week,
  COUNT(*) FILTER (WHERE property_type = 'off_plan') AS off_plan_meetings,
  COUNT(*) FILTER (WHERE property_type = 'secondary') AS secondary_meetings,
  COALESCE(AVG(budget), 0) AS avg_budget
FROM meetings
WHERE status != 'cancelled';

-- Create a view for cost metrics
CREATE VIEW cost_metrics AS
SELECT
  COALESCE(SUM(c.cost) / NULLIF(COUNT(DISTINCT DATE(c.timestamp)), 0), 0) AS avg_cost_per_day,
  COALESCE(SUM(c.cost) / NULLIF((SELECT COUNT(*) FROM meetings), 0), 0) AS avg_cost_per_meeting
FROM calls c;

-- Create a view for lead segmentation
CREATE VIEW lead_segmentation AS
SELECT
  status,
  COUNT(*) AS count
FROM leads
GROUP BY status;

-- Create a view for enhanced call analytics
CREATE VIEW call_enhanced_analytics AS
SELECT
  -- Call Counts
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE outcome = 'answered' AND duration > 0) AS successful_calls,
  COUNT(*) FILTER (WHERE outcome = 'no_answer' OR duration = 0) AS unsuccessful_calls,
  COUNT(*) FILTER (WHERE outcome IS NULL) AS unknown_outcome_calls,

  -- Call Duration
  COALESCE(AVG(duration) FILTER (WHERE duration > 0), 0) AS avg_call_duration,
  COALESCE(MAX(duration) FILTER (WHERE duration > 0), 0) AS max_call_duration,
  COALESCE(MIN(duration) FILTER (WHERE duration > 0), 0) AS min_call_duration,

  -- Call Latency (estimated as time between call creation and answer)
  COALESCE(AVG(
    EXTRACT(EPOCH FROM (timestamp - created_at))
    FILTER (WHERE outcome = 'answered')
  ), 0) AS avg_call_latency,

  -- Call Picked Up Rate
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE outcome = 'answered')::FLOAT / COUNT(*)) * 100, 2)
    ELSE 0
  END AS call_picked_up_rate,

  -- Call Successful Rate
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE outcome = 'answered' AND duration > 30)::FLOAT / COUNT(*)) * 100, 2)
    ELSE 0
  END AS call_successful_rate,

  -- Disconnection Reasons
  COUNT(*) FILTER (WHERE outcome = 'no_answer') AS dial_no_answer_count,
  COUNT(*) FILTER (WHERE outcome = 'call_back_later') AS customer_hangup_count,
  COUNT(*) FILTER (WHERE outcome = 'not_interested') AS agent_hangup_count,
  COUNT(*) FILTER (WHERE outcome = 'voicemail') AS voicemail_count,
  COUNT(*) FILTER (WHERE outcome = 'failed') AS dial_failed_count,

  -- Voicemail Rate
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE outcome = 'voicemail')::FLOAT / COUNT(*)) * 100, 2)
    ELSE 0
  END AS voicemail_rate,

  -- Call Direction
  COUNT(*) FILTER (WHERE call_type = 'Inbound') AS inbound_calls,
  COUNT(*) FILTER (WHERE call_type = 'Outbound') AS outbound_calls,
  COUNT(*) FILTER (WHERE call_type IS NULL) AS unknown_direction_calls

FROM calls;

-- Create a view for call analytics by day
CREATE VIEW call_analytics_by_day AS
SELECT
  DATE(timestamp) AS call_date,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE outcome = 'answered' AND duration > 0) AS successful_calls,
  COUNT(*) FILTER (WHERE outcome = 'no_answer' OR duration = 0) AS unsuccessful_calls,
  COALESCE(AVG(duration) FILTER (WHERE duration > 0), 0) AS avg_call_duration,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE outcome = 'answered')::FLOAT / COUNT(*)) * 100, 2)
    ELSE 0
  END AS call_picked_up_rate,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE outcome = 'answered' AND duration > 30)::FLOAT / COUNT(*)) * 100, 2)
    ELSE 0
  END AS call_successful_rate
FROM calls
GROUP BY DATE(timestamp)
ORDER BY call_date DESC;

-- Create a view for call analytics by agent
CREATE VIEW call_analytics_by_agent AS
SELECT
  COALESCE(agent_id, 'unknown') AS agent_id,
  COALESCE(agent_name, 'Unknown') AS agent_name,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE outcome = 'answered' AND duration > 0) AS successful_calls,
  COUNT(*) FILTER (WHERE outcome = 'no_answer' OR duration = 0) AS unsuccessful_calls,
  COALESCE(AVG(duration) FILTER (WHERE duration > 0), 0) AS avg_call_duration,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE outcome = 'answered')::FLOAT / COUNT(*)) * 100, 2)
    ELSE 0
  END AS call_picked_up_rate,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE outcome = 'answered' AND duration > 30)::FLOAT / COUNT(*)) * 100, 2)
    ELSE 0
  END AS call_successful_rate,
  COUNT(*) FILTER (WHERE outcome = 'voicemail') AS voicemail_count,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE outcome = 'voicemail')::FLOAT / COUNT(*)) * 100, 2)
    ELSE 0
  END AS voicemail_rate
FROM calls
GROUP BY agent_id, agent_name;
