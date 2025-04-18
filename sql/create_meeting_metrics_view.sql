-- Create a view for meeting metrics
CREATE OR REPLACE VIEW meeting_metrics AS
SELECT
    DATE(timestamp) as meeting_date,
    COUNT(*) as total_meetings,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_meetings,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_meetings,
    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_meetings
FROM
    meetings
GROUP BY
    DATE(timestamp)
ORDER BY
    meeting_date;
