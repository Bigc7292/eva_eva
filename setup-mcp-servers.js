#!/usr/bin/env node

/**
 * MCP Server Setup Script
 * This script helps set up all MCP servers except Google Drive
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting MCP Server Setup...\n');

// Configuration paths
const mcpConfigPath = path.join(process.env.APPDATA, 'Qoder', 'SharedClientCache', 'mcp.json');
const fixedConfigPath = path.join(__dirname, 'mcp-config-fixed.json');

// Step 1: Install required Python packages for webhook-tester
console.log('📦 Installing Python dependencies for webhook-tester...');
try {
  const webhookDir = path.join(__dirname, 'webhook-tester-mcp');
  if (fs.existsSync(webhookDir)) {
    process.chdir(webhookDir);
    execSync('pip install -r requirements.txt', { stdio: 'inherit' });
    console.log('✅ Python dependencies installed');
  } else {
    console.log('⚠️  Webhook-tester directory not found');
  }
} catch (error) {
  console.log('❌ Error installing Python dependencies:', error.message);
}

// Step 2: Install MCP packages
console.log('\n📦 Installing MCP packages...');
const mcpPackages = [
  '@modelcontextprotocol/server-github',
  '@playwright/mcp',
  '@upstash/context7-mcp',
  'figma-developer-mcp',
  '@mindpilot/mcp',
  '@modelcontextprotocol/server-supabase'
];

try {
  process.chdir(__dirname);
  for (const pkg of mcpPackages) {
    console.log(`Installing ${pkg}...`);
    execSync(`npm install -g ${pkg}`, { stdio: 'inherit' });
  }
  console.log('✅ All MCP packages installed');
} catch (error) {
  console.log('❌ Error installing MCP packages:', error.message);
}

// Step 3: Configuration instructions
console.log('\n📋 Configuration Instructions:');
console.log('=====================================');

console.log('\n1. Copy the fixed MCP configuration:');
console.log(`   Copy: ${fixedConfigPath}`);
console.log(`   To: ${mcpConfigPath}`);

console.log('\n2. Update API Keys and Credentials:');
console.log('   - GitHub: Token already configured');
console.log('   - Figma: Replace "your-figma-token-here" with your Figma API token');
console.log('   - Supabase: Replace "your-supabase-url" and "your-service-role-key"');

console.log('\n3. API Key Sources:');
console.log('   📊 Figma API Token:');
console.log('      - Go to https://www.figma.com/developers/api');
console.log('      - Generate a new personal access token');
console.log('      - Copy the token and replace "your-figma-token-here"');

console.log('\n   🗄️  Supabase Credentials:');
console.log('      - Go to your Supabase project dashboard');
console.log('      - Navigate to Settings > API');
console.log('      - Copy Project URL and Service Role Key');
console.log('      - Replace the placeholder values');

console.log('\n4. Restart Qoder IDE after updating the configuration');

console.log('\n✨ Setup script completed!');
console.log('Please follow the configuration instructions above to complete the setup.');