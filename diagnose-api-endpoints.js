/**
 * Script to check API endpoints and diagnose issues
 * This script will:
 * 1. Check common API endpoints
 * 2. Log any errors
 * 3. Suggest fixes
 */

const fetch = require('node-fetch');

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Check an API endpoint
 * @param {string} endpoint - API endpoint to check
 * @returns {Promise<Object>} - Response data and status
 */
async function checkEndpoint(endpoint) {
  try {
    log(`Checking endpoint: ${endpoint}`);
    
    const response = await fetch(`http://localhost:3004${endpoint}`);
    const status = response.status;
    
    log(`Status: ${status}`);
    
    let data = null;
    
    try {
      data = await response.json();
    } catch (error) {
      log(`Error parsing JSON: ${error.message}`);
    }
    
    return { endpoint, status, data };
  } catch (error) {
    log(`Error checking endpoint ${endpoint}: ${error.message}`);
    return { endpoint, status: 'error', error: error.message };
  }
}

/**
 * Check all API endpoints
 * @returns {Promise<Array>} - Array of endpoint check results
 */
async function checkAllEndpoints() {
  const endpoints = [
    '/api/metrics/calls',
    '/api/calls',
    '/api/calls/active',
    '/api/contacts',
    '/api/contacts/1/recordings',
    '/api/dashboard/stats'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Analyze results and suggest fixes
 * @param {Array} results - Array of endpoint check results
 */
function analyzeResults(results) {
  log('\nAnalysis:');
  
  const failedEndpoints = results.filter(result => result.status !== 200);
  
  if (failedEndpoints.length === 0) {
    log('All endpoints are working correctly!');
    return;
  }
  
  log(`${failedEndpoints.length} endpoints are failing:`);
  
  for (const result of failedEndpoints) {
    log(`\nEndpoint: ${result.endpoint}`);
    log(`Status: ${result.status}`);
    
    if (result.data && result.data.error) {
      log(`Error: ${result.data.error}`);
    }
    
    // Suggest fixes based on the endpoint and error
    suggestFix(result);
  }
}

/**
 * Suggest a fix for a failed endpoint
 * @param {Object} result - Endpoint check result
 */
function suggestFix(result) {
  log('Suggested fix:');
  
  if (result.endpoint === '/api/metrics/calls') {
    log('1. Check if the calls table exists and has the expected columns');
    log('2. Update the API endpoint to handle missing columns or tables');
    log('3. Add error handling to return a default response if the database query fails');
  } else if (result.endpoint === '/api/calls') {
    log('1. Check if the calls table exists and has the expected columns');
    log('2. Update the API endpoint to handle missing columns or tables');
    log('3. Add error handling to return an empty array if the database query fails');
  } else if (result.endpoint === '/api/calls/active') {
    log('1. Check if the calls table exists and has the expected columns');
    log('2. Update the API endpoint to handle missing columns or tables');
    log('3. Add error handling to return an empty array if the database query fails');
  } else if (result.endpoint === '/api/contacts') {
    log('1. Check if the contacts table exists and has the expected columns');
    log('2. Update the API endpoint to handle missing columns or tables');
    log('3. Add error handling to return an empty array if the database query fails');
  } else if (result.endpoint === '/api/contacts/1/recordings') {
    log('1. Check if the contacts and calls tables exist and have the expected columns');
    log('2. Update the API endpoint to handle missing columns or tables');
    log('3. Add error handling to return an empty array if the database query fails');
  } else if (result.endpoint === '/api/dashboard/stats') {
    log('1. Check if the calls, contacts, and meetings tables exist and have the expected columns');
    log('2. Update the API endpoint to handle missing columns or tables');
    log('3. Add error handling to return default stats if the database query fails');
  } else {
    log('1. Check the server logs for more details');
    log('2. Add error handling to the API endpoint');
    log('3. Update the API endpoint to handle missing data');
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting API endpoint check...');
    
    const results = await checkAllEndpoints();
    
    analyzeResults(results);
    
    log('\nAPI endpoint check completed');
  } catch (error) {
    log(`Error checking API endpoints: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
