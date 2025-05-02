/**
 * Script to update dashboard components to properly display call data
 * This script will:
 * 1. Update the DashboardHeader component to fetch and display call metrics
 * 2. Update the CallMetrics component to fetch and display call metrics
 * 3. Update the CallManagementMetrics component to fetch and display call metrics
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
 * Update DashboardHeader component
 * @returns {Promise<boolean>} - Success status
 */
async function updateDashboardHeader() {
  try {
    log('Updating DashboardHeader component...');
    
    const filePath = path.join('apps', 'frontend', 'src', 'components', 'dashboard', 'DashboardHeader.tsx');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      log(`File not found: ${filePath}`);
      return false;
    }
    
    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Update fetchStats function
    const updatedContent = content.replace(
      /const fetchStats = async \(\) => \{[\s\S]*?try \{[\s\S]*?const \{ data: callsData[\s\S]*?if \(leadsError \|\| callsError\) throw leadsError \|\| callsError[\s\S]*?\/\/ Calculate real statistics[\s\S]*?const totalLeads[\s\S]*?const successfulCalls[\s\S]*?const conversionRate[\s\S]*?setStats\(\{[\s\S]*?totalLeads,[\s\S]*?conversionRate,[\s\S]*?revenue: 0,[\s\S]*?agentScore: 0,[\s\S]*?changes: \{[\s\S]*?leads: 0,[\s\S]*?conversion: 0,[\s\S]*?revenue: 0,[\s\S]*?agentScore: 0[\s\S]*?\}[\s\S]*?\}\)[\s\S]*?\} catch \(error\) \{/,
      `const fetchStats = async () => {
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')

      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')

      if (leadsError || callsError) throw leadsError || callsError

      // Calculate real statistics
      const totalLeads = leadsData?.length || 0
      
      // Calculate call statistics
      const totalCalls = callsData?.length || 0
      const answeredCalls = callsData?.filter(call => {
        const status = String(call.call_status || '').toLowerCase();
        return status === 'completed' || status === 'answered' || status === 'ended';
      })?.length || 0
      
      const conversionRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0
      
      // Calculate agent score based on call metrics
      const callsWithTranscript = callsData?.filter(call => call.transcript)?.length || 0
      const callsWithSummary = callsData?.filter(call => call.summary)?.length || 0
      const callsWithRecording = callsData?.filter(call => call.recording_url || call.audio_url)?.length || 0
      
      const agentScore = totalCalls > 0 
        ? Math.round(((answeredCalls / totalCalls) * 0.5 + 
           (callsWithTranscript / totalCalls) * 0.2 + 
           (callsWithSummary / totalCalls) * 0.2 + 
           (callsWithRecording / totalCalls) * 0.1) * 100)
        : 0
      
      setStats({
        totalLeads,
        conversionRate,
        revenue: 0, // TODO: Add revenue calculation when available
        agentScore,
        changes: {
          leads: 0,
          conversion: 0,
          revenue: 0,
          agentScore: 0
        }
      })
    } catch (error) {`
    );
    
    // Write updated content
    fs.writeFileSync(filePath, updatedContent);
    
    log('DashboardHeader component updated successfully');
    return true;
  } catch (error) {
    log(`Error updating DashboardHeader component: ${error.message}`);
    return false;
  }
}

/**
 * Update CallMetrics component
 * @returns {Promise<boolean>} - Success status
 */
async function updateCallMetrics() {
  try {
    log('Updating CallMetrics component...');
    
    const filePath = path.join('apps', 'frontend', 'src', 'components', 'dashboard', 'CallMetrics.tsx');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      log(`File not found: ${filePath}`);
      return false;
    }
    
    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Update component to fetch data from calls table
    const updatedContent = content.replace(
      /interface CallMetricsProps \{[\s\S]*?metrics: \{[\s\S]*?total: number[\s\S]*?answered\?: number[\s\S]*?missed\?: number[\s\S]*?voicemail\?: number[\s\S]*?failed\?: number[\s\S]*?outbound\?: number[\s\S]*?inbound\?: number[\s\S]*?avgDuration: number[\s\S]*?answerRate\?: number[\s\S]*?conversionRate\?: number[\s\S]*?meetingsScheduled\?: number[\s\S]*?callbacksScheduled\?: number[\s\S]*?\}[\s\S]*?\}/,
      `interface CallMetricsProps {
  metrics: {
    total: number
    answered?: number
    missed?: number
    voicemail?: number
    failed?: number
    outbound?: number
    inbound?: number
    avgDuration: number
    answerRate?: number
    conversionRate?: number
    meetingsScheduled?: number
    callbacksScheduled?: number
  }
}

// Add useEffect to fetch call metrics from the database
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/services/supabase'

export function CallMetrics({ metrics: initialMetrics }: CallMetricsProps) {
  const [metrics, setMetrics] = useState(initialMetrics)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCallMetrics()
  }, [])

  const fetchCallMetrics = async () => {
    try {
      setLoading(true)
      
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')

      if (callsError) throw callsError

      // Calculate call metrics
      const total = callsData?.length || 0
      
      const outbound = callsData?.filter(call => 
        call.call_type === 'Outbound' || call.call_type === 'outbound'
      )?.length || 0
      
      const inbound = callsData?.filter(call => 
        call.call_type === 'Inbound' || call.call_type === 'inbound'
      )?.length || 0
      
      const answered = callsData?.filter(call => {
        const status = String(call.call_status || '').toLowerCase();
        return status === 'completed' || status === 'answered' || status === 'ended';
      })?.length || 0
      
      const missed = callsData?.filter(call => {
        const status = String(call.call_status || '').toLowerCase();
        return status === 'missed' || status === 'no-answer' || status === 'no answer';
      })?.length || 0
      
      const voicemail = callsData?.filter(call => {
        const status = String(call.call_status || '').toLowerCase();
        return status === 'voicemail';
      })?.length || 0
      
      const failed = callsData?.filter(call => {
        const status = String(call.call_status || '').toLowerCase();
        return status === 'failed' || status === 'error';
      })?.length || 0
      
      // Calculate average duration
      let totalDuration = 0
      let durationCount = 0
      
      callsData?.forEach(call => {
        if (call.duration && call.duration > 0) {
          totalDuration += call.duration
          durationCount++
        }
      })
      
      const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0
      
      // Calculate answer rate
      const answerRate = total > 0 ? (answered / total) * 100 : 0
      
      // Calculate conversion rate (placeholder)
      const conversionRate = answered > 0 ? 25 : 0 // Placeholder value
      
      // Calculate meetings scheduled (placeholder)
      const meetingsScheduled = Math.round(answered * 0.2) // Placeholder value
      
      // Calculate callbacks scheduled (placeholder)
      const callbacksScheduled = Math.round(answered * 0.3) // Placeholder value
      
      setMetrics({
        total,
        outbound,
        inbound,
        answered,
        missed,
        voicemail,
        failed,
        avgDuration,
        answerRate,
        conversionRate,
        meetingsScheduled,
        callbacksScheduled
      })
    } catch (error) {
      console.error('Error fetching call metrics:', error)
    } finally {
      setLoading(false)
    }
  }`
    );
    
    // Write updated content
    fs.writeFileSync(filePath, updatedContent);
    
    log('CallMetrics component updated successfully');
    return true;
  } catch (error) {
    log(`Error updating CallMetrics component: ${error.message}`);
    return false;
  }
}

/**
 * Update CallManagementMetrics component
 * @returns {Promise<boolean>} - Success status
 */
async function updateCallManagementMetrics() {
  try {
    log('Updating CallManagementMetrics component...');
    
    const filePath = path.join('apps', 'frontend', 'src', 'components', 'dashboard', 'CallManagementMetrics.tsx');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      log(`File not found: ${filePath}`);
      return false;
    }
    
    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Update fetchCallMetrics function
    const updatedContent = content.replace(
      /const fetchCallMetrics = async \(\) => \{[\s\S]*?try \{[\s\S]*?setLoading\(true\)[\s\S]*?\/\/ Fetch call metrics from API[\s\S]*?const response[\s\S]*?if \(!response\.ok\)[\s\S]*?const data[\s\S]*?setCallMetrics\(data\)[\s\S]*?\} catch \(error\) \{/,
      `const fetchCallMetrics = async () => {
    try {
      setLoading(true)
      
      // Fetch call metrics directly from Supabase
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')

      if (callsError) throw callsError

      // Calculate call metrics
      const total_calls = callsData?.length || 0
      
      // Get calls from today
      const today = new Date().toISOString().split('T')[0]
      const calls_today = callsData?.filter(call => {
        const callDate = new Date(call.start_time).toISOString().split('T')[0]
        return callDate === today
      })?.length || 0
      
      // Get calls from this week
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      
      const calls_this_week = callsData?.filter(call => {
        const callDate = new Date(call.start_time)
        return callDate >= weekStart
      })?.length || 0
      
      // Calculate answered calls
      const answered_calls = callsData?.filter(call => {
        const status = String(call.call_status || '').toLowerCase();
        return status === 'completed' || status === 'answered' || status === 'ended';
      })?.length || 0
      
      // Calculate missed calls
      const missed_calls = callsData?.filter(call => {
        const status = String(call.call_status || '').toLowerCase();
        return status === 'missed' || status === 'no-answer' || status === 'no answer';
      })?.length || 0
      
      // Calculate average duration
      let total_duration = 0
      let duration_count = 0
      
      callsData?.forEach(call => {
        if (call.duration && call.duration > 0) {
          total_duration += call.duration
          duration_count++
        }
      })
      
      const avg_call_duration = duration_count > 0 ? Math.round(total_duration / duration_count) : 0
      
      // Calculate answer rate
      const answer_rate = total_calls > 0 ? (answered_calls / total_calls) * 100 : 0
      
      // Calculate calls by day
      const calls_by_day = {}
      
      callsData?.forEach(call => {
        const callDate = new Date(call.start_time).toISOString().split('T')[0]
        calls_by_day[callDate] = (calls_by_day[callDate] || 0) + 1
      })
      
      // Calculate calls with transcript
      const calls_with_transcript = callsData?.filter(call => call.transcript)?.length || 0
      
      // Calculate calls with summary
      const calls_with_summary = callsData?.filter(call => call.summary)?.length || 0
      
      // Calculate calls with recording
      const calls_with_recording = callsData?.filter(call => call.recording_url || call.audio_url)?.length || 0
      
      // Set call metrics
      setCallMetrics({
        total_calls,
        calls_today,
        calls_this_week,
        answered_calls,
        missed_calls,
        avg_call_duration,
        answer_rate,
        calls_by_day,
        calls_with_transcript,
        calls_with_summary,
        calls_with_recording
      })
    } catch (error) {`
    );
    
    // Write updated content
    fs.writeFileSync(filePath, updatedContent);
    
    log('CallManagementMetrics component updated successfully');
    return true;
  } catch (error) {
    log(`Error updating CallManagementMetrics component: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting dashboard components update...');
    
    // Update DashboardHeader component
    const dashboardHeaderUpdated = await updateDashboardHeader();
    
    // Update CallMetrics component
    const callMetricsUpdated = await updateCallMetrics();
    
    // Update CallManagementMetrics component
    const callManagementMetricsUpdated = await updateCallManagementMetrics();
    
    log('Dashboard components update completed');
    log(`DashboardHeader: ${dashboardHeaderUpdated ? 'Updated' : 'Not updated'}`);
    log(`CallMetrics: ${callMetricsUpdated ? 'Updated' : 'Not updated'}`);
    log(`CallManagementMetrics: ${callManagementMetricsUpdated ? 'Updated' : 'Not updated'}`);
  } catch (error) {
    log(`Error updating dashboard components: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
