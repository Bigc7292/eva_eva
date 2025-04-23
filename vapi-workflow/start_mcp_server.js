#!/usr/bin/env node
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration
const VAPI_TOKEN = process.env.VAPI_TOKEN || "d1529b85-51d5-47c0-9332-a73d40f7d62b";

// Set environment variables
process.env.VAPI_TOKEN = VAPI_TOKEN;

console.log('=== Starting Vapi MCP Server ===');
console.log('This will start the server and keep it running.');
console.log('Press Ctrl+C to stop the server when you\'re done.');
console.log(`Using Vapi token: ${VAPI_TOKEN}`);

// Run the server
try {
  execSync('npx -y @vapi-ai/mcp-server', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting MCP server:', error.message);
  process.exit(1);
}
