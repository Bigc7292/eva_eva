const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../frontend/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const WEBHOOK_URL = 'https://ee20-91-73-200-83.ngrok-free.app/api/webhooks/vapi';

async function registerSupabaseWebhook() {
  try {
    console.log('Registering Supabase webhook with URL:', WEBHOOK_URL);
    console.log('Using Supabase URL:', SUPABASE_URL);
    console.log('Using Supabase Key:', SUPABASE_ANON_KEY ? 'Key found' : 'Key missing');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase credentials are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
      return;
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // First, check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('calls')
      .select('id')
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
          'id', NEW.id,
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
