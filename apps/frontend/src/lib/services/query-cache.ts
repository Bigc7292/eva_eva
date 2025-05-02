/**
 * Query Cache Service
 * 
 * This service provides caching for database queries to reduce the number of
 * requests to the database and improve performance.
 */

import { supabase } from './supabase';
import { supabaseLogger } from './logger';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  bypassCache?: boolean; // Whether to bypass the cache
}

// In-memory cache storage
const cache: Record<string, CacheEntry> = {};

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// Maximum cache size (number of entries)
const MAX_CACHE_SIZE = 100;

/**
 * Generate a cache key from a query
 * @param table - Table name
 * @param query - Query parameters
 * @returns Cache key
 */
function generateCacheKey(table: string, query: any): string {
  return `${table}:${JSON.stringify(query)}`;
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  const expiredKeys = Object.keys(cache).filter(key => cache[key].expiresAt < now);
  
  expiredKeys.forEach(key => {
    delete cache[key];
  });
  
  // If cache is still too large, remove oldest entries
  const keys = Object.keys(cache);
  if (keys.length > MAX_CACHE_SIZE) {
    // Sort by timestamp (oldest first)
    keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
    
    // Remove oldest entries
    keys.slice(0, keys.length - MAX_CACHE_SIZE).forEach(key => {
      delete cache[key];
    });
  }
}

/**
 * Execute a cached query
 * @param table - Table name
 * @param queryFn - Function that returns a Supabase query
 * @param options - Cache options
 * @returns Query result
 */
export async function cachedQuery<T = any>(
  table: string,
  queryFn: (supabase: typeof supabase) => any,
  options: CacheOptions = {}
): Promise<{ data: T | null; error: any }> {
  const { ttl = DEFAULT_TTL, bypassCache = false } = options;
  
  // Execute the query to get the full query object
  const query = queryFn(supabase);
  
  // Generate a cache key based on the query
  const cacheKey = generateCacheKey(table, query);
  
  // Clean up expired cache entries
  cleanupCache();
  
  // Check if we have a cached result and it's not expired
  if (!bypassCache && cache[cacheKey] && cache[cacheKey].expiresAt > Date.now()) {
    supabaseLogger.debug(`Cache hit for ${table}`, { cacheKey });
    return { data: cache[cacheKey].data, error: null };
  }
  
  // Execute the query
  const startTime = performance.now();
  const result = await query;
  const endTime = performance.now();
  
  supabaseLogger.debug(`Cache miss for ${table}, query took ${Math.round(endTime - startTime)}ms`, { cacheKey });
  
  // Cache the result if there's no error
  if (!result.error) {
    cache[cacheKey] = {
      data: result.data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
  }
  
  return result;
}

/**
 * Invalidate cache entries for a specific table
 * @param table - Table name
 */
export function invalidateCache(table: string): void {
  const keysToInvalidate = Object.keys(cache).filter(key => key.startsWith(`${table}:`));
  
  keysToInvalidate.forEach(key => {
    delete cache[key];
  });
  
  supabaseLogger.debug(`Invalidated cache for ${table}`, { count: keysToInvalidate.length });
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
  
  supabaseLogger.debug('Cleared entire cache');
}

// Set up a periodic cleanup task
setInterval(cleanupCache, 60000); // Run every minute
