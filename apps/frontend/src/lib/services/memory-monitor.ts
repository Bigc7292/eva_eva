/**
 * Memory Monitor Service
 * 
 * This service monitors memory usage in the application and provides
 * utilities to detect and prevent memory leaks.
 */

import { supabaseLogger } from './logger';

interface MemoryStats {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  usagePercentage: number;
}

interface MemorySnapshot {
  timestamp: number;
  stats: MemoryStats;
}

// Store memory snapshots for trend analysis
const memorySnapshots: MemorySnapshot[] = [];
const MAX_SNAPSHOTS = 100;

// Memory warning thresholds
const WARNING_THRESHOLD = 0.7; // 70% of heap size limit
const CRITICAL_THRESHOLD = 0.85; // 85% of heap size limit

// Subscribers to memory events
type MemorySubscriber = (stats: MemoryStats) => void;
const subscribers: MemorySubscriber[] = [];

/**
 * Get current memory usage statistics
 * @returns Memory statistics or null if not available
 */
export function getMemoryStats(): MemoryStats | null {
  if (typeof window === 'undefined' || !window.performance || !window.performance.memory) {
    return null;
  }
  
  const { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize } = window.performance.memory;
  const usagePercentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;
  
  return {
    jsHeapSizeLimit,
    totalJSHeapSize,
    usedJSHeapSize,
    usagePercentage
  };
}

/**
 * Take a memory snapshot
 */
export function takeMemorySnapshot(): void {
  const stats = getMemoryStats();
  
  if (!stats) {
    return;
  }
  
  const snapshot: MemorySnapshot = {
    timestamp: Date.now(),
    stats
  };
  
  memorySnapshots.push(snapshot);
  
  // Keep only the most recent snapshots
  if (memorySnapshots.length > MAX_SNAPSHOTS) {
    memorySnapshots.shift();
  }
  
  // Check for memory warnings
  checkMemoryWarnings(stats);
  
  // Notify subscribers
  subscribers.forEach(subscriber => subscriber(stats));
}

/**
 * Check for memory warnings
 * @param stats - Memory statistics
 */
function checkMemoryWarnings(stats: MemoryStats): void {
  const { usagePercentage } = stats;
  
  if (usagePercentage > CRITICAL_THRESHOLD * 100) {
    supabaseLogger.error('CRITICAL MEMORY USAGE', {
      usagePercentage: usagePercentage.toFixed(2) + '%',
      usedJSHeapSize: formatBytes(stats.usedJSHeapSize),
      jsHeapSizeLimit: formatBytes(stats.jsHeapSizeLimit)
    });
    
    // Force garbage collection if possible
    if (window.gc) {
      window.gc();
      supabaseLogger.info('Forced garbage collection');
    }
  } else if (usagePercentage > WARNING_THRESHOLD * 100) {
    supabaseLogger.warn('High memory usage', {
      usagePercentage: usagePercentage.toFixed(2) + '%',
      usedJSHeapSize: formatBytes(stats.usedJSHeapSize),
      jsHeapSizeLimit: formatBytes(stats.jsHeapSizeLimit)
    });
  }
}

/**
 * Format bytes to human-readable format
 * @param bytes - Bytes to format
 * @returns Formatted string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Subscribe to memory updates
 * @param callback - Callback function
 * @returns Unsubscribe function
 */
export function subscribeToMemoryUpdates(callback: MemorySubscriber): () => void {
  subscribers.push(callback);
  
  return () => {
    const index = subscribers.indexOf(callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

/**
 * Get memory usage trend
 * @returns Memory usage trend data
 */
export function getMemoryTrend(): { timestamp: number; usagePercentage: number }[] {
  return memorySnapshots.map(snapshot => ({
    timestamp: snapshot.timestamp,
    usagePercentage: snapshot.stats.usagePercentage
  }));
}

/**
 * Detect potential memory leaks
 * @returns Whether a potential memory leak was detected
 */
export function detectMemoryLeaks(): boolean {
  if (memorySnapshots.length < 10) {
    return false;
  }
  
  // Check if memory usage has been consistently increasing
  const recentSnapshots = memorySnapshots.slice(-10);
  let increasingCount = 0;
  
  for (let i = 1; i < recentSnapshots.length; i++) {
    if (recentSnapshots[i].stats.usedJSHeapSize > recentSnapshots[i - 1].stats.usedJSHeapSize) {
      increasingCount++;
    }
  }
  
  // If memory usage has increased in 8 out of 9 consecutive snapshots, it might be a leak
  const potentialLeak = increasingCount >= 8;
  
  if (potentialLeak) {
    supabaseLogger.warn('Potential memory leak detected', {
      increasingCount,
      initialUsage: formatBytes(recentSnapshots[0].stats.usedJSHeapSize),
      currentUsage: formatBytes(recentSnapshots[recentSnapshots.length - 1].stats.usedJSHeapSize)
    });
  }
  
  return potentialLeak;
}

// Take memory snapshots periodically
if (typeof window !== 'undefined') {
  setInterval(takeMemorySnapshot, 30000); // Every 30 seconds
  
  // Also check for memory leaks periodically
  setInterval(detectMemoryLeaks, 300000); // Every 5 minutes
}
