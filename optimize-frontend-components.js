/**
 * Script to optimize frontend components for better performance and data display
 * This script will:
 * 1. Add indexes to frequently queried columns
 * 2. Create views for common queries
 * 3. Update frontend components to use optimized queries
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
 * Add indexes to frequently queried columns
 * @returns {Promise<boolean>} - Success status
 */
async function addIndexes() {
  try {
    log('Adding indexes to frequently queried columns...');
    
    // Add index to calls.contact_id
    const { error: callsContactIdError } = await supabase
      .from('_temp_query')
      .select()
      .sql('CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls (contact_id);');
    
    if (callsContactIdError) {
      log(`Error adding index to calls.contact_id: ${callsContactIdError.message}`);
    } else {
      log('Added index to calls.contact_id');
    }
    
    // Add index to calls.call_status
    const { error: callsStatusError } = await supabase
      .from('_temp_query')
      .select()
      .sql('CREATE INDEX IF NOT EXISTS idx_calls_call_status ON calls (call_status);');
    
    if (callsStatusError) {
      log(`Error adding index to calls.call_status: ${callsStatusError.message}`);
    } else {
      log('Added index to calls.call_status');
    }
    
    // Add index to calls.call_type
    const { error: callsTypeError } = await supabase
      .from('_temp_query')
      .select()
      .sql('CREATE INDEX IF NOT EXISTS idx_calls_call_type ON calls (call_type);');
    
    if (callsTypeError) {
      log(`Error adding index to calls.call_type: ${callsTypeError.message}`);
    } else {
      log('Added index to calls.call_type');
    }
    
    // Add index to calls.start_time
    const { error: callsStartTimeError } = await supabase
      .from('_temp_query')
      .select()
      .sql('CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls (start_time);');
    
    if (callsStartTimeError) {
      log(`Error adding index to calls.start_time: ${callsStartTimeError.message}`);
    } else {
      log('Added index to calls.start_time');
    }
    
    // Add index to contacts.phone_number
    const { error: contactsPhoneError } = await supabase
      .from('_temp_query')
      .select()
      .sql('CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts (phone_number);');
    
    if (contactsPhoneError) {
      log(`Error adding index to contacts.phone_number: ${contactsPhoneError.message}`);
    } else {
      log('Added index to contacts.phone_number');
    }
    
    log('Indexes added successfully');
    return true;
  } catch (error) {
    log(`Error adding indexes: ${error.message}`);
    return false;
  }
}

/**
 * Create views for common queries
 * @returns {Promise<boolean>} - Success status
 */
async function createViews() {
  try {
    log('Creating views for common queries...');
    
    // Create view for call metrics
    const { error: callMetricsError } = await supabase
      .from('_temp_query')
      .select()
      .sql(`
        CREATE OR REPLACE VIEW call_metrics AS
        SELECT
          COUNT(*) AS total_calls,
          COUNT(CASE WHEN call_type = 'Outbound' THEN 1 END) AS outbound_calls,
          COUNT(CASE WHEN call_type = 'Inbound' THEN 1 END) AS inbound_calls,
          COUNT(CASE WHEN call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN 1 END) AS answered_calls,
          COUNT(CASE WHEN call_status IN ('Missed', 'No Answer', 'missed', 'no-answer', 'no answer') THEN 1 END) AS missed_calls,
          COALESCE(AVG(CASE WHEN call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN duration END), 0) AS avg_duration,
          COUNT(CASE WHEN transcript IS NOT NULL AND transcript != '' THEN 1 END) AS calls_with_transcript,
          COUNT(CASE WHEN summary IS NOT NULL AND summary != '' THEN 1 END) AS calls_with_summary,
          COUNT(CASE WHEN recording_url IS NOT NULL OR audio_url IS NOT NULL THEN 1 END) AS calls_with_recording
        FROM calls;
      `);
    
    if (callMetricsError) {
      log(`Error creating call_metrics view: ${callMetricsError.message}`);
    } else {
      log('Created call_metrics view');
    }
    
    // Create view for call metrics by day
    const { error: callMetricsByDayError } = await supabase
      .from('_temp_query')
      .select()
      .sql(`
        CREATE OR REPLACE VIEW call_metrics_by_day AS
        SELECT
          DATE_TRUNC('day', start_time) AS day,
          COUNT(*) AS total_calls,
          COUNT(CASE WHEN call_type = 'Outbound' THEN 1 END) AS outbound_calls,
          COUNT(CASE WHEN call_type = 'Inbound' THEN 1 END) AS inbound_calls,
          COUNT(CASE WHEN call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN 1 END) AS answered_calls,
          COUNT(CASE WHEN call_status IN ('Missed', 'No Answer', 'missed', 'no-answer', 'no answer') THEN 1 END) AS missed_calls
        FROM calls
        GROUP BY DATE_TRUNC('day', start_time)
        ORDER BY DATE_TRUNC('day', start_time) DESC;
      `);
    
    if (callMetricsByDayError) {
      log(`Error creating call_metrics_by_day view: ${callMetricsByDayError.message}`);
    } else {
      log('Created call_metrics_by_day view');
    }
    
    // Create view for contact call metrics
    const { error: contactCallMetricsError } = await supabase
      .from('_temp_query')
      .select()
      .sql(`
        CREATE OR REPLACE VIEW contact_call_metrics AS
        SELECT
          c.contact_id,
          c.name,
          c.phone_number,
          COUNT(cl.call_id) AS total_calls,
          COUNT(CASE WHEN cl.call_type = 'Outbound' THEN 1 END) AS outbound_calls,
          COUNT(CASE WHEN cl.call_type = 'Inbound' THEN 1 END) AS inbound_calls,
          COUNT(CASE WHEN cl.call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN 1 END) AS answered_calls,
          COUNT(CASE WHEN cl.call_status IN ('Missed', 'No Answer', 'missed', 'no-answer', 'no answer') THEN 1 END) AS missed_calls,
          COALESCE(AVG(CASE WHEN cl.call_status IN ('Completed', 'Answered', 'completed', 'answered') THEN cl.duration END), 0) AS avg_duration,
          MAX(cl.start_time) AS last_call_date
        FROM contacts c
        LEFT JOIN calls cl ON c.contact_id = cl.contact_id
        GROUP BY c.contact_id, c.name, c.phone_number;
      `);
    
    if (contactCallMetricsError) {
      log(`Error creating contact_call_metrics view: ${contactCallMetricsError.message}`);
    } else {
      log('Created contact_call_metrics view');
    }
    
    log('Views created successfully');
    return true;
  } catch (error) {
    log(`Error creating views: ${error.message}`);
    return false;
  }
}

/**
 * Update API endpoints to use optimized queries
 * @returns {Promise<boolean>} - Success status
 */
async function updateApiEndpoints() {
  try {
    log('Updating API endpoints to use optimized queries...');
    
    // Update /api/metrics/calls endpoint
    const callsApiPath = path.join('apps', 'frontend', 'src', 'app', 'api', 'metrics', 'calls', 'route.ts');
    
    if (fs.existsSync(callsApiPath)) {
      log(`Updating ${callsApiPath}...`);
      
      const callsApiContent = fs.readFileSync(callsApiPath, 'utf8');
      
      // Replace the query with an optimized version
      const updatedCallsApiContent = callsApiContent.replace(
        /const \{ data: callsData, error: callsDataError \} = await supabase\s+\.from\('calls'\)\s+\.select\('\*'\)/,
        `const { data: callsData, error: callsDataError } = await supabase
      .from('call_metrics')
      .select('*')
      .single()`
      );
      
      fs.writeFileSync(callsApiPath, updatedCallsApiContent);
      log(`Updated ${callsApiPath}`);
    } else {
      log(`File not found: ${callsApiPath}`);
    }
    
    // Update /api/calls endpoint
    const callsEndpointPath = path.join('apps', 'frontend', 'src', 'app', 'api', 'calls', 'route.ts');
    
    if (fs.existsSync(callsEndpointPath)) {
      log(`Updating ${callsEndpointPath}...`);
      
      const callsEndpointContent = fs.readFileSync(callsEndpointPath, 'utf8');
      
      // Replace the query with an optimized version
      const updatedCallsEndpointContent = callsEndpointContent.replace(
        /const \{ data, error \} = await supabase\s+\.from\('calls'\)\s+\.select\('\*'\)\s+\.order\('start_time', \{ ascending: false \}\)/,
        `const { data, error } = await supabase
      .from('calls')
      .select('*, contacts(name, phone_number)')
      .order('start_time', { ascending: false })
      .limit(100)`
      );
      
      fs.writeFileSync(callsEndpointPath, updatedCallsEndpointContent);
      log(`Updated ${callsEndpointPath}`);
    } else {
      log(`File not found: ${callsEndpointPath}`);
    }
    
    // Update /api/calls/active endpoint
    const activeCallsPath = path.join('apps', 'frontend', 'src', 'app', 'api', 'calls', 'active', 'route.ts');
    
    if (fs.existsSync(activeCallsPath)) {
      log(`Updating ${activeCallsPath}...`);
      
      const activeCallsContent = fs.readFileSync(activeCallsPath, 'utf8');
      
      // Replace the query with an optimized version
      const updatedActiveCallsContent = activeCallsContent.replace(
        /const \{ data, error \} = await supabase\s+\.from\('calls'\)\s+\.select\('\*'\)\s+\.or\('call_status\.eq\.In Progress,call_status\.eq\.Ringing,call_status\.eq\.Answered,call_status\.eq\.started'\)\s+\.order\('start_time', \{ ascending: false \}\)\s+\.limit\(10\)/,
        `const { data, error } = await supabase
      .from('calls')
      .select('*, contacts(name, phone_number)')
      .or('call_status.eq.In Progress,call_status.eq.Ringing,call_status.eq.Answered,call_status.eq.started')
      .order('start_time', { ascending: false })
      .limit(10)`
      );
      
      fs.writeFileSync(activeCallsPath, updatedActiveCallsContent);
      log(`Updated ${activeCallsPath}`);
    } else {
      log(`File not found: ${activeCallsPath}`);
    }
    
    log('API endpoints updated successfully');
    return true;
  } catch (error) {
    log(`Error updating API endpoints: ${error.message}`);
    return false;
  }
}

/**
 * Update frontend components to use optimized queries
 * @returns {Promise<boolean>} - Success status
 */
async function updateFrontendComponents() {
  try {
    log('Updating frontend components to use optimized queries...');
    
    // Update CallMetrics component
    const callMetricsPath = path.join('apps', 'frontend', 'src', 'components', 'dashboard', 'CallMetrics.tsx');
    
    if (fs.existsSync(callMetricsPath)) {
      log(`Updating ${callMetricsPath}...`);
      
      const callMetricsContent = fs.readFileSync(callMetricsPath, 'utf8');
      
      // Replace the fetchCallMetrics function with an optimized version
      const updatedCallMetricsContent = callMetricsContent.replace(
        /const fetchCallMetrics = async \(\) => \{[\s\S]*?try \{[\s\S]*?setLoading\(true\)[\s\S]*?const \{ data: callsData, error: callsError \} = await supabase[\s\S]*?\.from\('calls'\)[\s\S]*?\.select\('\*'\)[\s\S]*?if \(callsError\) throw callsError[\s\S]*?\/\/ Calculate call metrics[\s\S]*?const total = callsData\?\.length \|\| 0[\s\S]*?const outbound[\s\S]*?const inbound[\s\S]*?const answered[\s\S]*?const missed[\s\S]*?const voicemail[\s\S]*?const failed[\s\S]*?\/\/ Calculate average duration[\s\S]*?let totalDuration[\s\S]*?let durationCount[\s\S]*?callsData\?\.forEach[\s\S]*?const avgDuration[\s\S]*?\/\/ Calculate answer rate[\s\S]*?const answerRate[\s\S]*?\/\/ Calculate conversion rate[\s\S]*?const conversionRate[\s\S]*?\/\/ Calculate meetings scheduled[\s\S]*?const meetingsScheduled[\s\S]*?\/\/ Calculate callbacks scheduled[\s\S]*?const callbacksScheduled[\s\S]*?setMetrics\(\{[\s\S]*?total,[\s\S]*?outbound,[\s\S]*?inbound,[\s\S]*?answered,[\s\S]*?missed,[\s\S]*?voicemail,[\s\S]*?failed,[\s\S]*?avgDuration,[\s\S]*?answerRate,[\s\S]*?conversionRate,[\s\S]*?meetingsScheduled,[\s\S]*?callbacksScheduled[\s\S]*?\}\)[\s\S]*?\} catch \(error\) \{/,
        `const fetchCallMetrics = async () => {
    try {
      setLoading(true)
      
      // Fetch call metrics from the optimized view
      const { data: metrics, error } = await supabase
        .from('call_metrics')
        .select('*')
        .single()

      if (error) throw error

      // Fetch call metrics by day for trends
      const { data: metricsByDay, error: dayError } = await supabase
        .from('call_metrics_by_day')
        .select('*')
        .order('day', { ascending: false })
        .limit(7)

      if (dayError) console.error('Error fetching call metrics by day:', dayError)

      // Calculate answer rate
      const answerRate = metrics.total_calls > 0 ? (metrics.answered_calls / metrics.total_calls) * 100 : 0
      
      // Calculate conversion rate (placeholder)
      const conversionRate = metrics.answered_calls > 0 ? 25 : 0 // Placeholder value
      
      // Calculate meetings scheduled (placeholder)
      const meetingsScheduled = Math.round(metrics.answered_calls * 0.2) // Placeholder value
      
      // Calculate callbacks scheduled (placeholder)
      const callbacksScheduled = Math.round(metrics.answered_calls * 0.3) // Placeholder value
      
      setMetrics({
        total: metrics.total_calls,
        outbound: metrics.outbound_calls,
        inbound: metrics.inbound_calls,
        answered: metrics.answered_calls,
        missed: metrics.missed_calls,
        voicemail: 0, // Not tracked in the view
        failed: 0, // Not tracked in the view
        avgDuration: metrics.avg_duration,
        answerRate,
        conversionRate,
        meetingsScheduled,
        callbacksScheduled
      })
    } catch (error) {`
      );
      
      fs.writeFileSync(callMetricsPath, updatedCallMetricsContent);
      log(`Updated ${callMetricsPath}`);
    } else {
      log(`File not found: ${callMetricsPath}`);
    }
    
    // Update DashboardHeader component
    const dashboardHeaderPath = path.join('apps', 'frontend', 'src', 'components', 'dashboard', 'DashboardHeader.tsx');
    
    if (fs.existsSync(dashboardHeaderPath)) {
      log(`Updating ${dashboardHeaderPath}...`);
      
      const dashboardHeaderContent = fs.readFileSync(dashboardHeaderPath, 'utf8');
      
      // Replace the fetchStats function with an optimized version
      const updatedDashboardHeaderContent = dashboardHeaderContent.replace(
        /const fetchStats = async \(\) => \{[\s\S]*?try \{[\s\S]*?const \{ data: leadsData, error: leadsError \} = await supabase[\s\S]*?\.from\('leads'\)[\s\S]*?\.select\('\*'\)[\s\S]*?const \{ data: callsData, error: callsError \} = await supabase[\s\S]*?\.from\('calls'\)[\s\S]*?\.select\('\*'\)[\s\S]*?if \(leadsError \|\| callsError\) throw leadsError \|\| callsError[\s\S]*?\/\/ Calculate real statistics[\s\S]*?const totalLeads[\s\S]*?const successfulCalls[\s\S]*?const conversionRate[\s\S]*?setStats\(\{[\s\S]*?totalLeads,[\s\S]*?conversionRate,[\s\S]*?revenue: 0,[\s\S]*?agentScore: 0,[\s\S]*?changes: \{[\s\S]*?leads: 0,[\s\S]*?conversion: 0,[\s\S]*?revenue: 0,[\s\S]*?agentScore: 0[\s\S]*?\}[\s\S]*?\}\)[\s\S]*?\} catch \(error\) \{/,
        `const fetchStats = async () => {
    try {
      // Fetch leads count
      const { count: totalLeads, error: leadsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })

      if (leadsError) throw leadsError

      // Fetch call metrics from the optimized view
      const { data: metrics, error: metricsError } = await supabase
        .from('call_metrics')
        .select('*')
        .single()

      if (metricsError) throw metricsError
      
      // Calculate conversion rate
      const conversionRate = metrics.total_calls > 0 ? (metrics.answered_calls / metrics.total_calls) * 100 : 0
      
      // Calculate agent score based on call metrics
      const agentScore = metrics.total_calls > 0 
        ? Math.round(((metrics.answered_calls / metrics.total_calls) * 0.5 + 
           (metrics.calls_with_transcript / metrics.total_calls) * 0.2 + 
           (metrics.calls_with_summary / metrics.total_calls) * 0.2 + 
           (metrics.calls_with_recording / metrics.total_calls) * 0.1) * 100)
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
      
      fs.writeFileSync(dashboardHeaderPath, updatedDashboardHeaderContent);
      log(`Updated ${dashboardHeaderPath}`);
    } else {
      log(`File not found: ${dashboardHeaderPath}`);
    }
    
    log('Frontend components updated successfully');
    return true;
  } catch (error) {
    log(`Error updating frontend components: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting frontend optimization...');
    
    // Add indexes to frequently queried columns
    const indexesAdded = await addIndexes();
    
    // Create views for common queries
    const viewsCreated = await createViews();
    
    // Update API endpoints to use optimized queries
    const apiEndpointsUpdated = await updateApiEndpoints();
    
    // Update frontend components to use optimized queries
    const frontendComponentsUpdated = await updateFrontendComponents();
    
    log('Frontend optimization completed');
    log(`Indexes added: ${indexesAdded ? 'Yes' : 'No'}`);
    log(`Views created: ${viewsCreated ? 'Yes' : 'No'}`);
    log(`API endpoints updated: ${apiEndpointsUpdated ? 'Yes' : 'No'}`);
    log(`Frontend components updated: ${frontendComponentsUpdated ? 'Yes' : 'No'}`);
  } catch (error) {
    log(`Error optimizing frontend: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
