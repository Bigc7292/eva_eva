import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/services/supabase';

export async function checkTableStructure(client?: SupabaseClient) {
  // Use the provided client or fall back to the imported supabase client
  const supabaseClient = client || supabase;
  try {
    // Check if the calls table exists and get its structure
    const { data: callsData, error: callsError } = await supabaseClient
      .from('calls')
      .select('*')
      .limit(1);

    if (callsError) {
      console.error('Error accessing calls table:', callsError);
      return;
    }

    // Log the structure of the first row
    if (callsData && callsData.length > 0) {
      console.log('Calls table structure:', Object.keys(callsData[0]));
      console.log('Sample call data:', callsData[0]);
    } else {
      console.log('Calls table exists but is empty');
    }

    // Check if the lead_profiles table exists
    const { data: leadsData, error: leadsError } = await supabaseClient
      .from('lead_profiles')
      .select('*')
      .limit(1);

    if (leadsError) {
      console.error('Error accessing lead_profiles table:', leadsError);
      return;
    }

    // Log the structure of the first row
    if (leadsData && leadsData.length > 0) {
      console.log('Lead profiles table structure:', Object.keys(leadsData[0]));
      console.log('Sample lead data:', leadsData[0]);
    } else {
      console.log('Lead profiles table exists but is empty');
    }

  } catch (error) {
    console.error('Error checking table structure:', error);
  }
}
