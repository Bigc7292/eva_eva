-- Start a transaction
BEGIN;

-- Get the first three leads
WITH lead_data AS (
  SELECT id, name 
  FROM leads 
  WHERE crm_id IN ('CRM-IN-2024-0001', 'CRM-IN-2024-0002', 'CRM-OUT-2024-0001')
  ORDER BY crm_id
  LIMIT 3
)
-- Update each call record with a lead ID and proper audio URL
UPDATE calls 
SET 
  lead_id = (
    SELECT id 
    FROM lead_data 
    ORDER BY random() 
    LIMIT 1
  ),
  user_name = (
    SELECT name 
    FROM lead_data 
    ORDER BY random() 
    LIMIT 1
  ),
  audio_url = 'https://storage.retell.ai/calls/' || retell_call_id || '.mp3'
WHERE lead_id IS NULL;

COMMIT;