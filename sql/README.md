# Database Setup

This directory contains SQL scripts that need to be applied to the Supabase database.

## How to Apply

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `setup_database.sql` and execute it

This will create all the necessary database objects in one go.

## Database Objects Created

### Functions

#### get_meeting_locations_count
This function returns the count of meetings by location, excluding cancelled meetings.

#### get_answered_calls_per_day
This function returns the count of answered calls per day.

### Views

#### meeting_metrics
This view provides aggregated metrics about meetings, including total, completed, cancelled, and scheduled meetings.

#### call_metrics
This view provides aggregated metrics about calls, including total calls, answered calls, missed calls, answer rate, and average duration.

## Troubleshooting

If you encounter errors when executing these scripts:

1. Check if the objects already exist and drop them first:
   ```sql
   DROP FUNCTION IF EXISTS public.get_meeting_locations_count();
   DROP FUNCTION IF EXISTS public.get_answered_calls_per_day();
   DROP VIEW IF EXISTS meeting_metrics;
   DROP VIEW IF EXISTS call_metrics;
   ```

2. Make sure the tables referenced in the scripts exist and have the correct column names.

3. If you see errors about the `group` function not being available, it means your Supabase instance doesn't support the PostgreSQL `GROUP BY` clause in the way it's being used. In this case, you should use the fallback implementations in the API endpoints that don't rely on these database objects.
