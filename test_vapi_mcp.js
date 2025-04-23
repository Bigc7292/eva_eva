const { execSync } = require('child_process');

// Function to execute shell commands
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Main function
function main() {
  console.log('=== Testing Vapi MCP Server ===');
  
  // Install Vapi MCP Server
  console.log('\nInstalling Vapi MCP Server...');
  runCommand('npm install -g @vapi-ai/mcp-server');
  
  // Run Vapi MCP Server
  console.log('\nRunning Vapi MCP Server...');
  console.log('This will start the server and keep it running.');
  console.log('Press Ctrl+C to stop the server when you\'re done.');
  
  // Set environment variables
  process.env.VAPI_TOKEN = 'd1529b85-51d5-47c0-9332-a73d40f7d62b';
  
  // Run the server
  runCommand('npx -y @vapi-ai/mcp-server');
}

// Run the main function
main();
