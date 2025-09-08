/**
 * MCP API Route
 * 
 * This API route provides access to the database through MCP
 * It allows executing read-only queries and fetching the database schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getSchema } from '@/lib/mcp/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required parameter: action' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'query':
        if (!query) {
          return NextResponse.json(
            { error: 'Missing required parameter: query' },
            { status: 400 }
          );
        }
        
        const results = await executeQuery(query);
        return NextResponse.json({ results });

      case 'schema':
        const schema = await getSchema();
        return NextResponse.json({ schema });

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('MCP API error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}
