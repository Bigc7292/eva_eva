-- Create a function to update call_stats in contacts table
CREATE OR REPLACE FUNCTION update_contact_call_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the call_stats JSON field in the contacts table
    UPDATE contacts
    SET call_stats = jsonb_build_object(
        'total_calls', cs.total_calls,
        'answered_calls', cs.answered_calls,
        'missed_calls', cs.missed_calls,
        'avg_duration', cs.avg_duration,
        'last_call_date', cs.last_call_date,
        'last_call_status', cs.last_call_status
    ),
    updated_at = NOW()
    FROM contact_call_stats cs
    WHERE contacts.contact_id = cs.contact_id
    AND cs.contact_id = NEW.contact_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update call_stats when a call is inserted or updated
DROP TRIGGER IF EXISTS update_contact_call_stats_trigger ON calls;
CREATE TRIGGER update_contact_call_stats_trigger
AFTER INSERT OR UPDATE ON calls
FOR EACH ROW
EXECUTE FUNCTION update_contact_call_stats();

-- Create a function to ensure contact_id exists in contacts table
CREATE OR REPLACE FUNCTION ensure_contact_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if contact_id exists in contacts table
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE contact_id = NEW.contact_id) THEN
        -- If not, insert a new contact
        INSERT INTO contacts (contact_id, phone_number, created_at, updated_at)
        VALUES (NEW.contact_id, NEW.phone_number, NOW(), NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to ensure contact exists before inserting related records
DROP TRIGGER IF EXISTS ensure_contact_exists_calls_trigger ON calls;
CREATE TRIGGER ensure_contact_exists_calls_trigger
BEFORE INSERT ON calls
FOR EACH ROW
WHEN (NEW.contact_id IS NOT NULL)
EXECUTE FUNCTION ensure_contact_exists();

DROP TRIGGER IF EXISTS ensure_contact_exists_meetings_trigger ON meetings;
CREATE TRIGGER ensure_contact_exists_meetings_trigger
BEFORE INSERT ON meetings
FOR EACH ROW
WHEN (NEW.contact_id IS NOT NULL)
EXECUTE FUNCTION ensure_contact_exists();

DROP TRIGGER IF EXISTS ensure_contact_exists_emails_trigger ON emails;
CREATE TRIGGER ensure_contact_exists_emails_trigger
BEFORE INSERT ON emails
FOR EACH ROW
WHEN (NEW.contact_id IS NOT NULL)
EXECUTE FUNCTION ensure_contact_exists();

DROP TRIGGER IF EXISTS ensure_contact_exists_sms_trigger ON sms;
CREATE TRIGGER ensure_contact_exists_sms_trigger
BEFORE INSERT ON sms
FOR EACH ROW
WHEN (NEW.contact_id IS NOT NULL)
EXECUTE FUNCTION ensure_contact_exists();
