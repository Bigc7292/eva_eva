-- Setup script for database objects

-- Create the get_meeting_locations_count function
CREATE OR REPLACE FUNCTION public.get_meeting_locations_count()
RETURNS TABLE (
  location text,
  count bigint
)
LANGUAGE sql
AS $$
  SELECT
    location,
    COUNT(*) as count
  FROM
    meetings
  WHERE
    status != 'cancelled'
  GROUP BY
    location;
$$;

-- Create the get_answered_calls_per_day function
CREATE OR REPLACE FUNCTION public.get_answered_calls_per_day()
RETURNS TABLE (
  call_date date,
  answered_calls bigint
)
LANGUAGE sql
AS $$
  SELECT
    DATE(timestamp) as call_date,
    COUNT(*) as answered_calls
  FROM
    calls
  WHERE
    call_status = 'Completed' OR call_status = 'Answered'
  GROUP BY
    DATE(timestamp)
  ORDER BY
    call_date;
$$;

-- Create the meeting_metrics view
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

-- Create the call_metrics view
CREATE OR REPLACE VIEW call_metrics AS
SELECT
    COUNT(*) as total_calls,
    SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END) as answered_calls,
    SUM(CASE WHEN call_status = 'Missed' OR call_status = 'No Answer' THEN 1 ELSE 0 END) as missed_calls,
    CASE
        WHEN COUNT(*) > 0 THEN
            (SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END)::float / COUNT(*)::float) * 100
        ELSE 0
    END as answer_rate,
    CASE
        WHEN SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END) > 0 THEN
            SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN call_duration ELSE 0 END)::float /
            SUM(CASE WHEN call_status = 'Completed' OR call_status = 'Answered' THEN 1 ELSE 0 END)::float
        ELSE 0
    END as avg_duration
FROM
    calls;
