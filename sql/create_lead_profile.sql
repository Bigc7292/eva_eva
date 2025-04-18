-- Create lead profile for +971565401583 if it doesn't exist

-- First, check if the lead exists in the enhanced_leads table
DO $$
DECLARE
  lead_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM enhanced_leads WHERE phone_number = '+971565401583'
  ) INTO lead_exists;
  
  IF NOT lead_exists THEN
    -- Insert into enhanced_leads
    INSERT INTO enhanced_leads (
      lead_id,
      phone_number,
      name,
      status,
      lead_source,
      lead_quality,
      total_calls,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      '+971565401583',
      'Colin Loader',
      'new',
      'VAPI Call',
      'Warm',
      0,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created lead profile for +971565401583 in enhanced_leads table';
  ELSE
    RAISE NOTICE 'Lead profile for +971565401583 already exists in enhanced_leads table';
  END IF;
  
  -- Also check if the lead exists in the leads table
  SELECT EXISTS(
    SELECT 1 FROM leads WHERE phone = '+971565401583'
  ) INTO lead_exists;
  
  IF NOT lead_exists THEN
    -- Insert into leads
    INSERT INTO leads (
      id,
      name,
      phone,
      email,
      status,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      'Colin Loader',
      '+971565401583',
      'colin@toploaderagentai.com',
      'new',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created lead profile for +971565401583 in leads table';
  ELSE
    RAISE NOTICE 'Lead profile for +971565401583 already exists in leads table';
  END IF;
END $$;
