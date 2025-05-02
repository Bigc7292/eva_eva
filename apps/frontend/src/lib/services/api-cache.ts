/**
 * API Cache Service
 * 
 * This service provides caching for API responses to reduce the number of
 * network requests and improve performance.
 */

import { supabaseLogger } from './logger';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  bypassCache?: boolean; // Whether to bypass the cache
  cacheKey?: string; // Custom cache key
}

// In-memory cache storage
const cache: Record<string, CacheEntry> = {};

// Default TTL: 1 minute
const DEFAULT_TTL = 60 * 1000;

// Maximum cache size (number of entries)
const MAX_CACHE_SIZE = 100;

/**
 * Generate a cache key from a URL and options
 * @param url - API URL
 * @param options - Fetch options
 * @returns Cache key
 */
function generateCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  
  return `${method}:${url}:${body}`;
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
 * Cached fetch function
 * @param url - API URL
 * @param options - Fetch options
 * @param cacheOptions - Cache options
 * @returns Fetch response
 */
export async function cachedFetch<T = any>(
  url: string,
  options?: RequestInit,
  cacheOptions: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, bypassCache = false, cacheKey } = cacheOptions;
  
  // Only cache GET requests by default
  if ((options?.method && options.method !== 'GET') && !cacheKey) {
    return fetch(url, options).then(res => res.json());
  }
  
  // Generate a cache key
  const key = cacheKey || generateCacheKey(url, options);
  
  // Clean up expired cache entries
  cleanupCache();
  
  // Check if we have a cached result and it's not expired
  if (!bypassCache && cache[key] && cache[key].expiresAt > Date.now()) {
    supabaseLogger.debug(`API cache hit for ${url}`, { cacheKey: key });
    return cache[key].data as T;
  }
  
  // Fetch the data
  const startTime = performance.now();
  const response = await fetch(url, options);
  const data = await response.json();
  const endTime = performance.now();
  
  supabaseLogger.debug(`API cache miss for ${url}, request took ${Math.round(endTime - startTime)}ms`, { cacheKey: key });
  
  // Cache the result
  cache[key] = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl
  };
  
  return data as T;
}

/**
 * Invalidate cache entries for a specific URL pattern
 * @param urlPattern - URL pattern to match
 */
export function invalidateApiCache(urlPattern: string | RegExp): void {
  const keysToInvalidate = Object.keys(cache).filter(key => {
    if (typeof urlPattern === 'string') {
      return key.includes(urlPattern);
    } else {
      return urlPattern.test(key);
    }
  });
  
  keysToInvalidate.forEach(key => {
    delete cache[key];
  });
  
  supabaseLogger.debug(`Invalidated API cache for ${urlPattern}`, { count: keysToInvalidate.length });
}

/**
 * Clear the entire API cache
 */
export function clearApiCache(): void {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
  
  supabaseLogger.debug('Cleared entire API cache');
}

// Set up a periodic cleanup task
setInterval(cleanupCache, 60000); // Run every minute
