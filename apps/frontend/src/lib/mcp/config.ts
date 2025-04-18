/**
 * Model Context Protocol (MCP) Configuration
 * 
 * This file contains configuration for connecting to the MCP server
 * which allows LLMs to inspect database schemas and execute read-only queries.
 */

export const MCP_CONFIG = {
  // The MCP server URL provided by VAPI
  serverUrl: 'https://actions.zapier.com/mcp/sk-ak-dBnpbjLVCQX3oMnuHruLvJiX0a/sse',
  
  // Database connection details (these are already configured in Supabase)
  database: {
    host: 'stexfwbuwyyfmkmxcftv.supabase.co',
    port: 5432,
    user: 'postgres',
    password: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    database: 'postgres',
    schema: 'public'
  },
  
  // Options for MCP queries
  options: {
    timeout: 30000, // 30 seconds timeout for queries
    maxRows: 1000,  // Maximum number of rows to return
    readOnly: true  // Ensure queries are read-only for security
  }
};
