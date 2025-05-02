/**
 * Example of a Server Component with data fetching
 */

import { fetchFromSupabase, fetchWithRevalidation } from '@/lib/utils/server-fetch';

interface ServerDataComponentProps {
  contactId?: string;
}

export default async function ServerDataComponent({ contactId }: ServerDataComponentProps) {
  // Fetch data from Supabase
  const { data: contact, error } = await fetchFromSupabase(
    'contacts',
    (query) => query.select('*').eq('contact_id', contactId).single()
  );
  
  // Fetch data from an API with revalidation
  const apiData = await fetchWithRevalidation(
    '/api/some-data',
    { method: 'GET' },
    300 // Revalidate every 5 minutes
  );
  
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        Error loading data: {error.message}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{contact?.name}</h2>
      <div className="grid gap-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Phone:</span>
          <span>{contact?.phone_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email:</span>
          <span>{contact?.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span>{contact?.status}</span>
        </div>
      </div>
    </div>
  );
}