-- Create a view for call statistics by contact
CREATE OR REPLACE VIEW contact_call_stats AS
SELECT 
    contact_id,
    COUNT(*) as total_calls,
    SUM(CASE 
        WHEN LOWER(call_status) IN ('completed', 'answered', 'customer ended call', 'assistant ended call', 'silence timed out') 
        OR LOWER(call_status) LIKE '%customer ended%' 
        OR LOWER(call_status) LIKE '%assistant ended%' 
        THEN 1 
        ELSE 0 
    END) as answered_calls,
    SUM(CASE 
        WHEN LOWER(call_status) IN ('missed', 'no answer', 'failed', 'customer did not answer', 'customer busy', 'voicemail', 'unknown error') 
        OR LOWER(call_status) LIKE '%did not answer%' 
        OR LOWER(call_status) LIKE '%busy%' 
        OR LOWER(call_status) LIKE '%error%' 
        THEN 1 
        ELSE 0 
    END) as missed_calls,
    AVG(CASE 
        WHEN LOWER(call_status) IN ('completed', 'answered', 'customer ended call', 'assistant ended call', 'silence timed out') 
        OR LOWER(call_status) LIKE '%customer ended%' 
        OR LOWER(call_status) LIKE '%assistant ended%' 
        THEN duration 
        ELSE NULL 
    END) as avg_duration,
    MAX(start_time) as last_call_date,
    (array_agg(call_status ORDER BY start_time DESC))[1] as last_call_status
FROM 
    calls
WHERE 
    contact_id IS NOT NULL
GROUP BY 
    contact_id;

-- Create a view for contact profiles with enriched data
CREATE OR REPLACE VIEW enriched_contacts AS
SELECT 
    c.*,
    cs.total_calls,
    cs.answered_calls,
    cs.missed_calls,
    cs.avg_duration,
    cs.last_call_date,
    cs.last_call_status,
    COUNT(m.meeting_id) as total_meetings,
    SUM(CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END) as successful_meetings
FROM 
    contacts c
LEFT JOIN 
    contact_call_stats cs ON c.contact_id = cs.contact_id
LEFT JOIN 
    meetings m ON c.contact_id = m.contact_id
GROUP BY 
    c.contact_id, cs.total_calls, cs.answered_calls, cs.missed_calls, cs.avg_duration, cs.last_call_date, cs.last_call_status;

-- Create a view for recent activity
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'call' as activity_type,
    c.call_id as activity_id,
    c.contact_id,
    c.start_time as timestamp,
    c.call_status as status,
    c.call_type as type,
    c.summary,
    c.duration
FROM 
    calls c
UNION ALL
SELECT 
    'meeting' as activity_type,
    m.meeting_id as activity_id,
    m.contact_id,
    m.meeting_time as timestamp,
    m.status,
    m.type,
    m.notes as summary,
    NULL as duration
FROM 
    meetings m
UNION ALL
SELECT 
    'email' as activity_type,
    e.email_id as activity_id,
    e.contact_id,
    e.sent_time as timestamp,
    e.status,
    e.type,
    e.subject as summary,
    NULL as duration
FROM 
    emails e
UNION ALL
SELECT 
    'sms' as activity_type,
    s.sms_id as activity_id,
    s.contact_id,
    s.sent_time as timestamp,
    s.status,
    'sms' as type,
    s.content as summary,
    NULL as duration
FROM 
    sms s
ORDER BY 
    timestamp DESC;
