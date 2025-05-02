/**
 * Script to fix remaining issues in the project
 * This script will:
 * 1. Update the AdvancedTestCallPanel component to use Lucide React icons directly
 * 2. Fix any other remaining issues
 */

const fs = require('fs');
const path = require('path');

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Fix the AdvancedTestCallPanel component
 * @returns {Promise<boolean>} - Success status
 */
async function fixAdvancedTestCallPanel() {
  try {
    log('Fixing AdvancedTestCallPanel component...');
    
    const filePath = path.join('apps', 'frontend', 'src', 'components', 'dashboard', 'AdvancedTestCallPanel.tsx');
    
    if (!fs.existsSync(filePath)) {
      log(`File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the custom icon imports with Lucide React imports
    content = content.replace(
      `import { Phone } from 'lucide-react'
import { PhoneOff } from '@/components/ui/icons/phone-off'
import { AlertCircle } from '@/components/ui/icons/alert-circle'`,
      `import { Phone, PhoneCall, AlertOctagon } from 'lucide-react'`
    );
    
    // Replace the PhoneOff icon usage
    content = content.replace(
      `<PhoneOff className="mr-2 h-4 w-4" />`,
      `<PhoneCall className="mr-2 h-4 w-4" />`
    );
    
    // Replace the AlertCircle icon usage
    content = content.replace(
      `<AlertCircle className="mr-2 h-4 w-4 text-primary" />`,
      `<AlertOctagon className="mr-2 h-4 w-4 text-primary" />`
    );
    
    fs.writeFileSync(filePath, content);
    
    log('Fixed AdvancedTestCallPanel component');
    return true;
  } catch (error) {
    log(`Error fixing AdvancedTestCallPanel component: ${error.message}`);
    return false;
  }
}

/**
 * Remove unused icon files
 * @returns {Promise<boolean>} - Success status
 */
async function removeUnusedIconFiles() {
  try {
    log('Removing unused icon files...');
    
    const phoneOffPath = path.join('apps', 'frontend', 'src', 'components', 'ui', 'icons', 'phone-off.tsx');
    const alertCirclePath = path.join('apps', 'frontend', 'src', 'components', 'ui', 'icons', 'alert-circle.tsx');
    
    if (fs.existsSync(phoneOffPath)) {
      fs.unlinkSync(phoneOffPath);
      log(`Removed ${phoneOffPath}`);
    }
    
    if (fs.existsSync(alertCirclePath)) {
      fs.unlinkSync(alertCirclePath);
      log(`Removed ${alertCirclePath}`);
    }
    
    log('Removed unused icon files');
    return true;
  } catch (error) {
    log(`Error removing unused icon files: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting fix remaining issues...');
    
    // Fix the AdvancedTestCallPanel component
    await fixAdvancedTestCallPanel();
    
    // Remove unused icon files
    await removeUnusedIconFiles();
    
    log('Fix remaining issues completed successfully');
  } catch (error) {
    log(`Error fixing remaining issues: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
