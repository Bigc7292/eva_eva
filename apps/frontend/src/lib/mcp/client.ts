/**
 * MCP Client
 * 
 * This file contains utility functions for connecting to the MCP server
 * and executing queries against the database.
 */

import { MCP_CONFIG } from './config';

interface MCPRequest {
  type: string;
  query?: string;
  schema?: string;
  options?: {
    timeout?: number;
    maxRows?: number;
  };
}

interface MCPResponse {
  type: string;
  data?: any;
  error?: string;
  schema?: any;
}

/**
 * Execute a query against the database using MCP
 * 
 * @param query SQL query to execute (must be read-only)
 * @returns Promise with the query results
 */
export async function executeQuery(query: string): Promise<any> {
  try {
    // Validate that the query is read-only (basic check)
    if (!isReadOnlyQuery(query)) {
      throw new Error('Only read-only queries are allowed for security reasons');
    }

    const response = await fetch(MCP_CONFIG.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'query',
        query,
        options: MCP_CONFIG.options
      } as MCPRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP server error: ${response.status} ${errorText}`);
    }

    const result = await response.json() as MCPResponse;
    
    if (result.error) {
      throw new Error(`Query error: ${result.error}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error executing MCP query:', error);
    throw error;
  }
}

/**
 * Get the database schema using MCP
 * 
 * @returns Promise with the database schema
 */
export async function getSchema(): Promise<any> {
  try {
    const response = await fetch(MCP_CONFIG.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'schema',
        schema: MCP_CONFIG.database.schema
      } as MCPRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP server error: ${response.status} ${errorText}`);
    }

    const result = await response.json() as MCPResponse;
    
    if (result.error) {
      throw new Error(`Schema error: ${result.error}`);
    }

    return result.schema;
  } catch (error) {
    console.error('Error fetching database schema:', error);
    throw error;
  }
}

/**
 * Basic check to ensure a query is read-only
 * This is a simple heuristic and not foolproof
 * 
 * @param query SQL query to check
 * @returns boolean indicating if the query appears to be read-only
 */
function isReadOnlyQuery(query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  
  // Check if query starts with SELECT and doesn't contain write operations
  const isSelect = normalizedQuery.startsWith('select');
  const hasWriteOperations = [
    'insert into', 
    'update ', 
    'delete from', 
    'drop ', 
    'create ', 
    'alter ', 
    'truncate '
  ].some(op => normalizedQuery.includes(op));
  
  return isSelect && !hasWriteOperations;
}
