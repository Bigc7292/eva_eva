/**
 * Script to optimize server-side rendering
 * This script will:
 * 1. Identify components that should be client-side only
 * 2. Add proper use client directives
 * 3. Optimize data fetching for SSR
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Logger function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Find components that should be client-side only
 * @returns {Promise<Array<string>>} - Array of file paths
 */
async function findClientComponents() {
  return new Promise((resolve, reject) => {
    glob('apps/frontend/src/components/**/*.tsx', (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      const clientComponents = [];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check if the component uses hooks, browser APIs, or event handlers
        const usesClientFeatures = 
          content.includes('useState') || 
          content.includes('useEffect') || 
          content.includes('useRef') || 
          content.includes('useCallback') || 
          content.includes('useMemo') || 
          content.includes('window.') || 
          content.includes('document.') || 
          content.includes('localStorage') || 
          content.includes('sessionStorage') || 
          content.includes('onClick=') || 
          content.includes('onChange=') || 
          content.includes('onSubmit=');
        
        // Check if the component already has 'use client' directive
        const hasUseClientDirective = content.includes("'use client'") || content.includes('"use client"');
        
        if (usesClientFeatures && !hasUseClientDirective) {
          clientComponents.push(file);
        }
      }
      
      resolve(clientComponents);
    });
  });
}

/**
 * Add 'use client' directive to components
 * @param {Array<string>} components - Array of component file paths
 * @returns {Promise<boolean>} - Success status
 */
async function addUseClientDirective(components) {
  try {
    log(`Adding 'use client' directive to ${components.length} components...`);
    
    for (const file of components) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Add 'use client' directive at the top of the file
      const updatedContent = "'use client'\n\n" + content;
      
      fs.writeFileSync(file, updatedContent);
      log(`Added 'use client' directive to ${file}`);
    }
    
    log(`'use client' directive added to ${components.length} components`);
    return true;
  } catch (error) {
    log(`Error adding 'use client' directive: ${error.message}`);
    return false;
  }
}

/**
 * Create data fetching utilities for SSR
 * @returns {Promise<boolean>} - Success status
 */
async function createDataFetchingUtilities() {
  try {
    log('Creating data fetching utilities for SSR...');
    
    const utilsDir = path.join('apps', 'frontend', 'src', 'lib', 'utils');
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }
    
    // Create server-side data fetching utility
    const serverFetchPath = path.join(utilsDir, 'server-fetch.ts');
    const serverFetchContent = `/**
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
}`;
    
    fs.writeFileSync(serverFetchPath, serverFetchContent);
    log('Created server-side data fetching utility');
    
    // Create example server component
    const examplesDir = path.join('apps', 'frontend', 'src', 'components', 'examples');
    if (!fs.existsSync(examplesDir)) {
      fs.mkdirSync(examplesDir, { recursive: true });
    }
    
    const serverComponentPath = path.join(examplesDir, 'ServerDataComponent.tsx');
    const serverComponentContent = `/**
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
}`;
    
    fs.writeFileSync(serverComponentPath, serverComponentContent);
    log('Created example server component');
    
    return true;
  } catch (error) {
    log(`Error creating data fetching utilities: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting SSR optimization...');
    
    // Find components that should be client-side only
    const clientComponents = await findClientComponents();
    
    // Add 'use client' directive to components
    const directivesAdded = await addUseClientDirective(clientComponents);
    
    // Create data fetching utilities for SSR
    const utilitiesCreated = await createDataFetchingUtilities();
    
    log('SSR optimization completed');
    log(`'use client' directive added to ${clientComponents.length} components: ${directivesAdded ? 'Yes' : 'No'}`);
    log(`Data fetching utilities created: ${utilitiesCreated ? 'Yes' : 'No'}`);
  } catch (error) {
    log(`Error optimizing SSR: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
