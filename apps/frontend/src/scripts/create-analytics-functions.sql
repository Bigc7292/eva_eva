-- SQL functions for call analytics

-- Function to get calls by status
CREATE OR REPLACE FUNCTION get_calls_by_status(start_date timestamp)
RETURNS TABLE (
  status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    call_status as status,
    COUNT(*) as count
  FROM calls
  WHERE start_time >= start_date
  GROUP BY call_status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get calls by day
CREATE OR REPLACE FUNCTION get_calls_by_day(start_date timestamp)
RETURNS TABLE (
  date date,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(start_time) as date,
    COUNT(*) as count
  FROM calls
  WHERE start_time >= start_date
  GROUP BY DATE(start_time)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Function to get calls by type
CREATE OR REPLACE FUNCTION get_calls_by_type(start_date timestamp)
RETURNS TABLE (
  type text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    call_type as type,
    COUNT(*) as count
  FROM calls
  WHERE start_time >= start_date
  GROUP BY call_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get call duration statistics
CREATE OR REPLACE FUNCTION get_call_duration_stats(start_date timestamp)
RETURNS TABLE (
  average float,
  min integer,
  max integer,
  total bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(call_duration), 0) as average,
    COALESCE(MIN(call_duration), 0) as min,
    COALESCE(MAX(call_duration), 0) as max,
    COALESCE(SUM(call_duration), 0) as total
  FROM calls
  WHERE 
    start_time >= start_date
    AND call_duration IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
