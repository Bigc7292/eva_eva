-- Create a view that joins calls with lead information
CREATE OR REPLACE VIEW call_details AS
SELECT 
  c.id as call_id,
  c.retell_call_id,
  c.timestamp,
  c.call_duration,
  c.call_type,
  c.call_status,
  c.audio_url,
  c.detailed_call_summary,
  l.id as lead_id,
  l.crm_id,
  l.name,
  l.email,
  l.phone,
  l.property_interest,
  l.investment_type,
  l.budget_range,
  l.status as lead_status,
  l.priority,
  l.rating,
  l.ai_sentiment
FROM calls c
JOIN leads l ON c.lead_id = l.id;

-- Grant access to the view
GRANT SELECT ON call_details TO anon;
GRANT SELECT ON call_details TO authenticated;
GRANT SELECT ON call_details TO service_role;

-- Add comment for documentation
COMMENT ON VIEW call_details IS 'Detailed view of calls with associated lead information';

-- Create a materialized view for better performance (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS call_details_materialized AS
SELECT * FROM call_details;

-- Create index on the materialized view
CREATE UNIQUE INDEX idx_call_details_materialized_id ON call_details_materialized(call_id);
CREATE INDEX idx_call_details_materialized_timestamp ON call_details_materialized(timestamp);

-- Grant access to the materialized view
GRANT SELECT ON call_details_materialized TO anon;
GRANT SELECT ON call_details_materialized TO authenticated;
GRANT SELECT ON call_details_materialized TO service_role;

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_call_details_materialized()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY call_details_materialized;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh materialized view when calls or leads are modified
DROP TRIGGER IF EXISTS refresh_call_details_mv ON calls;
CREATE TRIGGER refresh_call_details_mv
  AFTER INSERT OR UPDATE OR DELETE ON calls
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_call_details_materialized();

DROP TRIGGER IF EXISTS refresh_call_details_mv_leads ON leads;
CREATE TRIGGER refresh_call_details_mv_leads
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_call_details_materialized(); 