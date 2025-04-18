-- Function to get answered calls per day
CREATE OR REPLACE FUNCTION public.get_answered_calls_per_day()
RETURNS TABLE (
  call_date date,
  answered_calls bigint
) 
LANGUAGE sql
AS $$
  SELECT 
    DATE(start_time) as call_date, 
    COUNT(*) as answered_calls
  FROM 
    calls
  WHERE 
    call_status = 'Completed' OR call_status = 'Answered'
  GROUP BY 
    DATE(start_time)
  ORDER BY 
    call_date;
$$;
