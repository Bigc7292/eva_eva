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

    // Check if the contacts table exists
    const { data: contactsData, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('*')
      .limit(1);

    if (contactsError) {
      console.error('Error accessing contacts table:', contactsError);
    } else {
      // Log the structure of the first row
      if (contactsData && contactsData.length > 0) {
        console.log('Contacts table structure:', Object.keys(contactsData[0]));
        console.log('Sample contact data:', contactsData[0]);
      } else {
        console.log('Contacts table exists but is empty');
      }
    }

  } catch (error) {
    console.error('Error checking table structure:', error);
  }
}
