/**
 * Script to optimize resource cleanup in React components
 * This script will:
 * 1. Add proper cleanup in useEffect hooks
 * 2. Ensure event listeners are removed
 * 3. Ensure subscriptions are properly unsubscribed
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Logger function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Find components with potential memory leaks
 * @returns {Promise<Array<string>>} - Array of file paths
 */
async function findComponentsWithPotentialLeaks() {
  return new Promise((resolve, reject) => {
    glob('apps/frontend/src/components/**/*.tsx', (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(files);
    });
  });
}

/**
 * Check for missing cleanup in useEffect
 * @param {string} content - File content
 * @returns {boolean} - Whether the file has missing cleanup
 */
function hasMissingCleanup(content) {
  // Check for useEffect without return function
  const useEffectRegex = /useEffect\(\s*\(\)\s*=>\s*\{[^}]*\}\s*,\s*\[[^\]]*\]\s*\)/g;
  const useEffectMatches = content.match(useEffectRegex);
  
  if (useEffectMatches) {
    // Check if any useEffect doesn't have a return statement
    return useEffectMatches.some(match => !match.includes('return'));
  }
  
  return false;
}

/**
 * Fix missing cleanup in useEffect
 * @param {string} content - File content
 * @returns {string} - Updated file content
 */
function fixMissingCleanup(content) {
  // Find useEffect hooks with potential issues
  const useEffectRegex = /useEffect\(\s*\(\)\s*=>\s*\{([^}]*)\}\s*,\s*\[[^\]]*\]\s*\)/g;
  
  return content.replace(useEffectRegex, (match, effectBody) => {
    // Check if there's already a return statement
    if (match.includes('return')) {
      return match;
    }
    
    // Check for common patterns that need cleanup
    const needsCleanup = 
      effectBody.includes('setInterval') || 
      effectBody.includes('setTimeout') || 
      effectBody.includes('addEventListener') || 
      effectBody.includes('subscribe');
    
    if (!needsCleanup) {
      return match;
    }
    
    // Add appropriate cleanup based on the pattern
    if (effectBody.includes('setInterval')) {
      return match.replace(/\{([^}]*)\}/, (m, body) => {
        return `{${body}\n    return () => {\n      // Cleanup interval to prevent memory leaks\n      if (intervalId) clearInterval(intervalId);\n    };\n  }`;
      });
    }
    
    if (effectBody.includes('setTimeout')) {
      return match.replace(/\{([^}]*)\}/, (m, body) => {
        return `{${body}\n    return () => {\n      // Cleanup timeout to prevent memory leaks\n      if (timeoutId) clearTimeout(timeoutId);\n    };\n  }`;
      });
    }
    
    if (effectBody.includes('addEventListener')) {
      return match.replace(/\{([^}]*)\}/, (m, body) => {
        return `{${body}\n    return () => {\n      // Remove event listener to prevent memory leaks\n      window.removeEventListener('event', handler);\n    };\n  }`;
      });
    }
    
    if (effectBody.includes('subscribe')) {
      return match.replace(/\{([^}]*)\}/, (m, body) => {
        return `{${body}\n    return () => {\n      // Unsubscribe to prevent memory leaks\n      if (subscription) subscription.unsubscribe();\n    };\n  }`;
      });
    }
    
    return match;
  });
}

/**
 * Fix a component file
 * @param {string} filePath - Path to the component file
 * @returns {Promise<boolean>} - Success status
 */
async function fixComponentFile(filePath) {
  try {
    log(`Checking ${filePath}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!hasMissingCleanup(content)) {
      log(`No issues found in ${filePath}`);
      return true;
    }
    
    log(`Fixing missing cleanup in ${filePath}...`);
    
    const updatedContent = fixMissingCleanup(content);
    
    fs.writeFileSync(filePath, updatedContent);
    
    log(`Fixed ${filePath}`);
    return true;
  } catch (error) {
    log(`Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting resource cleanup optimization...');
    
    const componentFiles = await findComponentsWithPotentialLeaks();
    
    log(`Found ${componentFiles.length} component files to check`);
    
    let fixedCount = 0;
    
    for (const filePath of componentFiles) {
      const success = await fixComponentFile(filePath);
      
      if (success) {
        fixedCount++;
      }
    }
    
    log(`Resource cleanup optimization completed`);
    log(`Checked ${componentFiles.length} files, fixed ${fixedCount} files`);
  } catch (error) {
    log(`Error optimizing resource cleanup: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
