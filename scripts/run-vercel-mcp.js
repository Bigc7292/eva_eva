#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Check if VERCEL_API_KEY is set
if (!process.env.VERCEL_API_KEY) {
  console.error('Error: VERCEL_API_KEY is not set in .env.local');
  console.error('Please add your Vercel API key to .env.local:');
  console.error('VERCEL_API_KEY=your_api_key_here');
  process.exit(1);
}

// Create the scripts directory if it doesn't exist
const scriptsDir = path.resolve(process.cwd(), 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Run the Vercel MCP server
const vercelMcp = spawn('npx', ['vercel-mcp', `VERCEL_API_KEY=${process.env.VERCEL_API_KEY}`], {
  stdio: 'inherit',
  shell: true
});

vercelMcp.on('error', (error) => {
  console.error(`Error running Vercel MCP server: ${error.message}`);
  process.exit(1);
});

vercelMcp.on('close', (code) => {
  console.log(`Vercel MCP server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  vercelMcp.kill('SIGINT');
});

process.on('SIGTERM', () => {
  vercelMcp.kill('SIGTERM');
});
