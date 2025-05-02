/**
 * Server-side data fetching utilities
 * These utilities are designed to be used in Server Components
 */

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server components
const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          'x-supabase-cookie': cookieStore.get('sb-access-token')?.value || '',
        },
      },
    }
  );
};

// Cached version of createServerSupabaseClient
export const getServerSupabaseClient = cache(() => {
  return createServerSupabaseClient();
});

/**
 * Fetch data from Supabase on the server
 * This function is designed to be used in Server Components
 * @param table - Table name
 * @param queryBuilder - Function to build the query
 * @returns Query result
 */
export async function fetchFromSupabase(
  table: string,
  queryBuilder: (supabase: ReturnType<typeof createServerSupabaseClient>) => any
) {
  const supabase = getServerSupabaseClient();
  const query = queryBuilder(supabase.from(table));
  return await query;
}

/**
 * Fetch data with revalidation
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param revalidate - Revalidation time in seconds
 * @returns Fetch response
 */
export async function fetchWithRevalidation(
  url: string,
  options?: RequestInit,
  revalidate = 60
) {
  return fetch(url, {
    ...options,
    next: { revalidate },
  }).then(res => res.json());
}