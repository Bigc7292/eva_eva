-- 1. Migrate leads to contacts
INSERT INTO contacts (id, name, phone_number, email, profile_created_at)
SELECT
  l.uuid,           -- Use uuid from leads as id in contacts
  l.name,
  l.phone_number,
  l.email,
  COALESCE(l.created_at, now())
FROM leads l
ON CONFLICT (id) DO NOTHING;

-- 2. Migrate lead_profiles data (if contacts has these columns)
-- Adjust columns as needed for your contacts table
UPDATE contacts c
SET
  -- Example: add more fields if your contacts table supports them
  -- transcripts = COALESCE(lp.transcripts, '[]'::jsonb),
  -- summaries = COALESCE(lp.summaries, '[]'::jsonb),
  -- audio_files = COALESCE(lp.audio_files, '[]'::jsonb)
  -- For now, just update profile_created_at if needed
  profile_created_at = COALESCE(lp.first_contact_date, c.profile_created_at)
FROM lead_profiles lp
WHERE c.phone_number = lp.phone;  -- Join on phone number

-- 3. Update calls table to reference contacts
UPDATE calls
SET contact_id = l.uuid
FROM leads l
WHERE calls.contact_id IS NULL AND calls.lead_id = l.uuid;

-- 4. (Optional) Archive or drop old tables after verifying migration
-- DROP TABLE leads;
-- DROP TABLE lead_profiles;
-- DROP TABLE enhanced_leads;
