/**
 * Deploy Vapi Workflow
 * 
 * This script deploys the Vapi workflow and all necessary components.
 */

// Import required modules
const { spawn } = require('child_process');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const config = {
  workflowId: '',
  baseUrl: '',
  testPhoneNumber: ''
};

/**
 * Run a command and return the output
 */
function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

/**
 * Ask a question and get the answer
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Create the workflow
 */
async function createWorkflow() {
  console.log('\n=== Creating Workflow ===');
  
  try {
    await runCommand('node', ['create-vapi-workflow.js']);
    
    // Ask for the workflow ID
    config.workflowId = await askQuestion('Enter the workflow ID from the output above: ');
    
    if (!config.workflowId) {
      throw new Error('Workflow ID is required');
    }
    
    console.log(`Workflow ID: ${config.workflowId}`);
  } catch (error) {
    console.error('Error creating workflow:', error);
    throw error;
  }
}

/**
 * Update the workflow BASE_URL
 */
async function updateWorkflowBaseUrl() {
  console.log('\n=== Updating Workflow BASE_URL ===');
  
  try {
    // Ask for the base URL
    config.baseUrl = await askQuestion('Enter the base URL for your API server (e.g., https://your-api-server.com): ');
    
    if (!config.baseUrl) {
      throw new Error('Base URL is required');
    }
    
    // Set environment variables
    process.env.WORKFLOW_ID = config.workflowId;
    process.env.BASE_URL = config.baseUrl;
    
    await runCommand('node', ['update-workflow-base-url.js']);
    
    console.log(`Workflow BASE_URL updated to: ${config.baseUrl}`);
  } catch (error) {
    console.error('Error updating workflow BASE_URL:', error);
    throw error;
  }
}

/**
 * Test the workflow
 */
async function testWorkflow() {
  console.log('\n=== Testing Workflow ===');
  
  try {
    // Ask for the test phone number
    config.testPhoneNumber = await askQuestion('Enter a phone number to test the workflow (or press Enter to skip): ');
    
    if (!config.testPhoneNumber) {
      console.log('Skipping workflow test');
      return;
    }
    
    // Set environment variables
    process.env.WORKFLOW_ID = config.workflowId;
    process.env.TEST_PHONE_NUMBER = config.testPhoneNumber;
    
    await runCommand('node', ['test-vapi-workflow.js']);
    
    console.log(`Test call initiated to: ${config.testPhoneNumber}`);
  } catch (error) {
    console.error('Error testing workflow:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('=== Vapi Workflow Deployment ===');
    console.log('This script will deploy the Vapi workflow and all necessary components.');
    
    // Create the workflow
    await createWorkflow();
    
    // Update the workflow BASE_URL
    await updateWorkflowBaseUrl();
    
    // Test the workflow
    await testWorkflow();
    
    console.log('\n=== Deployment Complete ===');
    console.log('The Vapi workflow has been deployed successfully.');
    console.log('Workflow ID:', config.workflowId);
    console.log('Base URL:', config.baseUrl);
    
    if (config.testPhoneNumber) {
      console.log('Test Phone Number:', config.testPhoneNumber);
    }
    
    console.log('\nNext steps:');
    console.log('1. Check the Vapi dashboard for call logs and recordings');
    console.log('2. Customize the workflow as needed');
    console.log('3. Integrate with your CRM system');
    
  } catch (error) {
    console.error('Deployment failed:', error);
  } finally {
    rl.close();
  }
}

// Run the script
main();
