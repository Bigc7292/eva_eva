/**
 * Script to refresh dashboard data
 * This script will:
 * 1. Calculate dashboard metrics from the calls table
 * 2. Update the dashboard KPI cards
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Calculate dashboard metrics
 * @returns {Promise<Object>} - Dashboard metrics
 */
async function calculateDashboardMetrics() {
  try {
    log('Calculating dashboard metrics...');
    
    // Get all calls
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*');
    
    if (callsError) {
      throw callsError;
    }
    
    log(`Found ${calls.length} calls`);
    
    // Calculate metrics
    const metrics = {
      totalCalls: calls.length,
      inboundCalls: 0,
      outboundCalls: 0,
      answeredCalls: 0,
      missedCalls: 0,
      totalDuration: 0,
      avgDuration: 0,
      callsWithTranscript: 0,
      callsWithSummary: 0,
      callsWithRecording: 0,
      callsByDate: {},
      callsByPhoneNumber: {}
    };
    
    // Process each call
    for (const call of calls) {
      // Count inbound/outbound calls
      if (call.call_type === 'Inbound') {
        metrics.inboundCalls++;
      } else if (call.call_type === 'Outbound') {
        metrics.outboundCalls++;
      }
      
      // Count answered/missed calls
      const status = String(call.call_status || '').toLowerCase();
      if (status === 'completed' || status === 'answered' || status === 'ended') {
        metrics.answeredCalls++;
        if (call.duration) {
          metrics.totalDuration += call.duration;
        }
      } else if (status === 'missed' || status === 'no-answer' || status === 'no answer') {
        metrics.missedCalls++;
      }
      
      // Count calls with transcript/summary/recording
      if (call.transcript) metrics.callsWithTranscript++;
      if (call.summary) metrics.callsWithSummary++;
      if (call.recording_url || call.audio_url) metrics.callsWithRecording++;
      
      // Group calls by date
      const date = new Date(call.start_time).toISOString().split('T')[0];
      metrics.callsByDate[date] = (metrics.callsByDate[date] || 0) + 1;
      
      // Group calls by phone number
      const phoneNumber = call.phone_number || 'Unknown';
      metrics.callsByPhoneNumber[phoneNumber] = (metrics.callsByPhoneNumber[phoneNumber] || 0) + 1;
    }
    
    // Calculate average duration
    metrics.avgDuration = metrics.answeredCalls > 0 ? Math.round(metrics.totalDuration / metrics.answeredCalls) : 0;
    
    log('Dashboard metrics calculated successfully');
    log(`Total calls: ${metrics.totalCalls}`);
    log(`Inbound calls: ${metrics.inboundCalls}`);
    log(`Outbound calls: ${metrics.outboundCalls}`);
    log(`Answered calls: ${metrics.answeredCalls}`);
    log(`Missed calls: ${metrics.missedCalls}`);
    log(`Average duration: ${metrics.avgDuration} seconds`);
    log(`Calls with transcript: ${metrics.callsWithTranscript}`);
    log(`Calls with summary: ${metrics.callsWithSummary}`);
    log(`Calls with recording: ${metrics.callsWithRecording}`);
    
    return metrics;
  } catch (error) {
    log(`Error calculating dashboard metrics: ${error.message}`);
    return null;
  }
}

/**
 * Update dashboard KPI cards
 * @param {Object} metrics - Dashboard metrics
 * @returns {Promise<boolean>} - Success status
 */
async function updateDashboardKPICards(metrics) {
  try {
    log('Updating dashboard KPI cards...');
    
    // Check if dashboard_metrics table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('dashboard_metrics')
      .select('count(*)', { count: 'exact' });
    
    if (tableError && tableError.code !== 'PGRST116') {
      // Table doesn't exist, create it
      log('Creating dashboard_metrics table...');
      
      const { error: createError } = await supabase
        .from('dashboard_metrics')
        .insert([{
          id: 1,
          total_calls: metrics.totalCalls,
          inbound_calls: metrics.inboundCalls,
          outbound_calls: metrics.outboundCalls,
          answered_calls: metrics.answeredCalls,
          missed_calls: metrics.missedCalls,
          avg_duration: metrics.avgDuration,
          calls_with_transcript: metrics.callsWithTranscript,
          calls_with_summary: metrics.callsWithSummary,
          calls_with_recording: metrics.callsWithRecording,
          calls_by_date: metrics.callsByDate,
          calls_by_phone_number: metrics.callsByPhoneNumber,
          updated_at: new Date().toISOString()
        }]);
      
      if (createError) {
        log(`Error creating dashboard_metrics: ${createError.message}`);
        return false;
      }
      
      log('Dashboard metrics created successfully');
    } else {
      // Table exists, update it
      const { error: updateError } = await supabase
        .from('dashboard_metrics')
        .update({
          total_calls: metrics.totalCalls,
          inbound_calls: metrics.inboundCalls,
          outbound_calls: metrics.outboundCalls,
          answered_calls: metrics.answeredCalls,
          missed_calls: metrics.missedCalls,
          avg_duration: metrics.avgDuration,
          calls_with_transcript: metrics.callsWithTranscript,
          calls_with_summary: metrics.callsWithSummary,
          calls_with_recording: metrics.callsWithRecording,
          calls_by_date: metrics.callsByDate,
          calls_by_phone_number: metrics.callsByPhoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);
      
      if (updateError) {
        log(`Error updating dashboard_metrics: ${updateError.message}`);
        return false;
      }
      
      log('Dashboard metrics updated successfully');
    }
    
    return true;
  } catch (error) {
    log(`Error updating dashboard KPI cards: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting dashboard refresh...');
    
    // Calculate dashboard metrics
    const metrics = await calculateDashboardMetrics();
    
    if (!metrics) {
      log('Failed to calculate dashboard metrics');
      return;
    }
    
    // Update dashboard KPI cards
    const success = await updateDashboardKPICards(metrics);
    
    if (!success) {
      log('Failed to update dashboard KPI cards');
      return;
    }
    
    log('Dashboard refresh completed successfully');
  } catch (error) {
    log(`Error refreshing dashboard: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
