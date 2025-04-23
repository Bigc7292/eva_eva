const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute shell commands
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Installing Vapi MCP Server ===');
  
  // Check if .env file exists, if not copy from .env.mcp
  if (!fs.existsSync('.env') && fs.existsSync('.env.mcp')) {
    console.log('Creating .env file from .env.mcp...');
    fs.copyFileSync('.env.mcp', '.env');
  }
  
  // Install dependencies
  console.log('\nInstalling dependencies...');
  runCommand('npm install @modelcontextprotocol/sdk dotenv');
  
  // Install Vapi MCP Server globally
  console.log('\nInstalling Vapi MCP Server globally...');
  runCommand('npm install -g @vapi-ai/mcp-server');
  
  console.log('\n=== Installation Complete ===');
  console.log('You can now use the Vapi MCP Server in the following ways:');
  console.log('\n1. Run the local MCP server:');
  console.log('   npx -y @vapi-ai/mcp-server');
  console.log('\n2. List assistants and phone numbers:');
  console.log('   node setup_vapi_mcp_server.js');
  console.log('\n3. Create a call:');
  console.log('   node create_vapi_call.js [assistantId] [phoneNumberId] [customerPhoneNumber]');
  console.log('\nSee VAPI_MCP_README.md for more details.');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
