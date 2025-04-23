/**
 * Setup Vapi Workflow
 * 
 * This script sets up the Vapi workflow for real estate lead qualification.
 * It combines all the steps into a single command.
 */

// Import required modules
const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const config = {
  vapiPrivateKey: process.env.VAPI_PRIVATE_KEY || '',
  vapiPublicKey: process.env.VAPI_PUBLIC_KEY || '',
  assistantId: process.env.VAPI_ASSISTANT_ID || '',
  phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || '',
  baseUrl: process.env.BASE_URL || '',
  workflowId: '',
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
      shell: true,
      env: {
        ...process.env,
        VAPI_PRIVATE_KEY: config.vapiPrivateKey,
        VAPI_PUBLIC_KEY: config.vapiPublicKey,
        VAPI_ASSISTANT_ID: config.assistantId,
        VAPI_PHONE_NUMBER_ID: config.phoneNumberId,
        BASE_URL: config.baseUrl,
        WORKFLOW_ID: config.workflowId,
        TEST_PHONE_NUMBER: config.testPhoneNumber
      }
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
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * Check environment variables
 */
async function checkEnvironment() {
  console.log('\n=== Checking Environment Variables ===');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  let envExists = false;
  
  try {
    await fs.promises.access(envPath, fs.constants.F_OK);
    envExists = true;
    console.log('✅ .env file exists');
  } catch (error) {
    console.log('❌ .env file does not exist');
  }
  
  // Get Vapi credentials
  if (!config.vapiPrivateKey) {
    config.vapiPrivateKey = await askQuestion('Enter your Vapi private API key');
  }
  
  if (!config.vapiPublicKey) {
    config.vapiPublicKey = await askQuestion('Enter your Vapi public API key');
  }
  
  if (!config.assistantId) {
    config.assistantId = await askQuestion('Enter your Vapi assistant ID');
  }
  
  if (!config.phoneNumberId) {
    config.phoneNumberId = await askQuestion('Enter your Vapi phone number ID');
  }
  
  if (!config.baseUrl) {
    config.baseUrl = await askQuestion('Enter your API server URL', 'http://localhost:3004');
  }
  
  // Create .env file if it doesn't exist
  if (!envExists) {
    const envContent = `VAPI_PRIVATE_KEY=${config.vapiPrivateKey}
VAPI_PUBLIC_KEY=${config.vapiPublicKey}
VAPI_ASSISTANT_ID=${config.assistantId}
VAPI_PHONE_NUMBER_ID=${config.phoneNumberId}
BASE_URL=${config.baseUrl}
`;
    
    try {
      await fs.promises.writeFile(envPath, envContent);
      console.log('✅ Created .env file');
    } catch (error) {
      console.error('❌ Error creating .env file:', error);
    }
  }
  
  // Set environment variables
  process.env.VAPI_PRIVATE_KEY = config.vapiPrivateKey;
  process.env.VAPI_PUBLIC_KEY = config.vapiPublicKey;
  process.env.VAPI_ASSISTANT_ID = config.assistantId;
  process.env.VAPI_PHONE_NUMBER_ID = config.phoneNumberId;
  process.env.BASE_URL = config.baseUrl;
}

/**
 * Check Vapi assistant
 */
async function checkAssistant() {
  console.log('\n=== Checking Vapi Assistant ===');
  
  try {
    await runCommand('node', ['check-vapi-assistant.js']);
  } catch (error) {
    console.error('❌ Error checking assistant:', error);
    
    const proceed = await askQuestion('Do you want to proceed anyway? (y/n)', 'n');
    
    if (proceed.toLowerCase() !== 'y') {
      throw new Error('Setup aborted');
    }
  }
}

/**
 * Check API endpoints
 */
async function checkApiEndpoints() {
  console.log('\n=== Checking API Endpoints ===');
  
  try {
    await runCommand('node', ['check-api-endpoints.js']);
  } catch (error) {
    console.error('❌ Error checking API endpoints:', error);
    
    const proceed = await askQuestion('Do you want to proceed anyway? (y/n)', 'n');
    
    if (proceed.toLowerCase() !== 'y') {
      throw new Error('Setup aborted');
    }
  }
}

/**
 * Create workflow
 */
async function createWorkflow() {
  console.log('\n=== Creating Workflow ===');
  
  try {
    await runCommand('node', ['create-vapi-workflow.js']);
    
    // Ask for the workflow ID
    config.workflowId = await askQuestion('Enter the workflow ID from the output above');
    
    if (!config.workflowId) {
      throw new Error('Workflow ID is required');
    }
    
    console.log(`Workflow ID: ${config.workflowId}`);
    
    // Update .env file with workflow ID
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    try {
      envContent = await fs.promises.readFile(envPath, 'utf8');
    } catch (error) {
      console.error('❌ Error reading .env file:', error);
    }
    
    if (envContent) {
      envContent += `\nWORKFLOW_ID=${config.workflowId}\n`;
      
      try {
        await fs.promises.writeFile(envPath, envContent);
        console.log('✅ Updated .env file with workflow ID');
      } catch (error) {
        console.error('❌ Error updating .env file:', error);
      }
    }
    
    // Set environment variable
    process.env.WORKFLOW_ID = config.workflowId;
  } catch (error) {
    console.error('❌ Error creating workflow:', error);
    throw error;
  }
}

/**
 * Update workflow BASE_URL
 */
async function updateWorkflowBaseUrl() {
  console.log('\n=== Updating Workflow BASE_URL ===');
  
  try {
    await runCommand('node', ['update-workflow-base-url.js']);
  } catch (error) {
    console.error('❌ Error updating workflow BASE_URL:', error);
    throw error;
  }
}

/**
 * Assign workflow to assistant
 */
async function assignWorkflowToAssistant() {
  console.log('\n=== Assigning Workflow to Assistant ===');
  
  try {
    await runCommand('node', ['assign-workflow-to-assistant.js']);
  } catch (error) {
    console.error('❌ Error assigning workflow to assistant:', error);
    throw error;
  }
}

/**
 * Test workflow
 */
async function testWorkflow() {
  console.log('\n=== Testing Workflow ===');
  
  try {
    // Ask for the test phone number
    config.testPhoneNumber = await askQuestion('Enter a phone number to test the workflow (or press Enter to skip)');
    
    if (!config.testPhoneNumber) {
      console.log('Skipping workflow test');
      return;
    }
    
    await runCommand('node', ['test-vapi-workflow.js']);
  } catch (error) {
    console.error('❌ Error testing workflow:', error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('=== Vapi Workflow Setup ===');
    console.log('This script will set up the Vapi workflow for real estate lead qualification.');
    
    // Check environment variables
    await checkEnvironment();
    
    // Check Vapi assistant
    await checkAssistant();
    
    // Check API endpoints
    await checkApiEndpoints();
    
    // Create workflow
    await createWorkflow();
    
    // Update workflow BASE_URL
    await updateWorkflowBaseUrl();
    
    // Assign workflow to assistant
    await assignWorkflowToAssistant();
    
    // Test workflow
    await testWorkflow();
    
    console.log('\n=== Setup Complete ===');
    console.log('The Vapi workflow has been set up successfully.');
    console.log('Workflow ID:', config.workflowId);
    console.log('Assistant ID:', config.assistantId);
    console.log('Base URL:', config.baseUrl);
    
    console.log('\nNext steps:');
    console.log('1. Check the Vapi dashboard for call logs and recordings');
    console.log('2. Make test calls to verify the workflow is working correctly');
    console.log('3. Customize the workflow as needed');
    
    console.log('\nFor more information, see VAPI_WORKFLOW_SETUP_GUIDE.md');
    
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    rl.close();
  }
}

// Run the script
main();
