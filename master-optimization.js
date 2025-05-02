/**
 * Master Optimization Script
 * 
 * This script runs all optimization scripts in sequence to perform a deep
 * optimization of the entire application.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Logger function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  // Also append to log file
  fs.appendFileSync('optimization.log', logMessage + '\n');
}

/**
 * Run a script with proper error handling
 * @param {string} scriptPath - Path to the script
 * @param {string} description - Description of the script
 * @returns {Promise<boolean>} - Success status
 */
async function runScript(scriptPath, description) {
  try {
    log(`Running ${description}...`);
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      log(`Script not found: ${scriptPath}`);
      return false;
    }
    
    // Run the script
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    
    log(`${description} completed successfully`);
    return true;
  } catch (error) {
    log(`Error running ${description}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting master optimization process...');
    
    // Create optimization log file
    fs.writeFileSync('optimization.log', `Master Optimization Log - ${new Date().toISOString()}\n\n`);
    
    // Run database optimization
    const databaseOptimized = await runScript(
      'optimize-database-performance.js',
      'Database optimization'
    );
    
    // Run resource cleanup optimization
    const resourceCleanupOptimized = await runScript(
      'optimize-resource-cleanup.js',
      'Resource cleanup optimization'
    );
    
    // Run bundle size optimization
    const bundleSizeOptimized = await runScript(
      'optimize-bundle-size.js',
      'Bundle size optimization'
    );
    
    // Run SSR optimization
    const ssrOptimized = await runScript(
      'optimize-ssr.js',
      'Server-side rendering optimization'
    );
    
    // Run frontend optimization
    const frontendOptimized = await runScript(
      'optimize-frontend-components.js',
      'Frontend component optimization'
    );
    
    // Print summary
    log('\nOptimization Summary:');
    log(`Database optimization: ${databaseOptimized ? 'Completed' : 'Failed'}`);
    log(`Resource cleanup optimization: ${resourceCleanupOptimized ? 'Completed' : 'Failed'}`);
    log(`Bundle size optimization: ${bundleSizeOptimized ? 'Completed' : 'Failed'}`);
    log(`Server-side rendering optimization: ${ssrOptimized ? 'Completed' : 'Failed'}`);
    log(`Frontend component optimization: ${frontendOptimized ? 'Completed' : 'Failed'}`);
    
    log('\nMaster optimization process completed');
  } catch (error) {
    log(`Error in master optimization process: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
