import { NextResponse } from 'next/server';

/**
 * Health check endpoint for the frontend service
 * Used by Docker healthcheck and monitoring systems
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      service: 'frontend',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}
