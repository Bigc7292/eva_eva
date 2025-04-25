const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';
const WEBHOOK_URL = 'https://6294-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

async function registerSupabaseWebhook() {
  try {
    console.log('Registering Supabase webhook with URL:', WEBHOOK_URL);
    console.log('Using Supabase URL:', SUPABASE_URL);
    console.log('Using Supabase Key:', SUPABASE_ANON_KEY ? 'Key found' : 'Key missing');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase credentials are missing.');
      return;
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // First, check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('calls')
      .select('call_id')
      .limit(1);

    if (testError) {
      console.error('Error connecting to Supabase:', testError);
      return;
    }

    console.log('Successfully connected to Supabase');

    // For Supabase, we need to create a database function and trigger to send webhooks
    // This is typically done through SQL, but we can use the REST API to execute SQL

    // Create a function to send webhooks
    const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.handle_webhook_event()
    RETURNS TRIGGER AS $$
    BEGIN
      PERFORM http_post(
        '${WEBHOOK_URL}',
        json_build_object(
          'table', TG_TABLE_NAME,
          'type', TG_OP,
          'id', NEW.call_id,
          'record', row_to_json(NEW),
          'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
        ),
        'application/json'
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Create a trigger for the calls table
    const createTriggerSQL = `
    DROP TRIGGER IF EXISTS calls_webhook_trigger ON public.calls;
    CREATE TRIGGER calls_webhook_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.calls
    FOR EACH ROW EXECUTE FUNCTION public.handle_webhook_event();
    `;

    // Execute the SQL
    const { error: functionError } = await supabase.rpc('pgcrypto', { sql: createFunctionSQL });
    if (functionError) {
      console.error('Error creating webhook function:', functionError);
      // Continue anyway, as the function might already exist
    } else {
      console.log('Successfully created webhook function');
    }

    const { error: triggerError } = await supabase.rpc('pgcrypto', { sql: createTriggerSQL });
    if (triggerError) {
      console.error('Error creating webhook trigger:', triggerError);
    } else {
      console.log('Successfully created webhook trigger');
    }

    console.log('Supabase webhook setup complete');

  } catch (error) {
    console.error('Error registering Supabase webhook:', error);
  }
}

registerSupabaseWebhook();
