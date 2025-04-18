-- Function to get meeting locations count
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
