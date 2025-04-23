import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { googleAuthService } from '@/lib/services/google-auth-service';

export async function GET(request: NextRequest) {
  try {
    // Get the origin from the request
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

    // Log environment variables for debugging
    console.log('Environment variables:', {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      HAS_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET
    });

    // Generate Google OAuth URL with hardcoded client ID and redirect URI
    const clientId = '889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com';
    // Use ngrok URL with simple HTML callback which is guaranteed to work
    const redirectUri = 'https://7ffc-91-73-200-83.ngrok-free.app/api/auth/google/simple-html-callback';
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;

    console.log('Redirecting to Google OAuth URL:', authUrl);

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google auth URL:', error);

    // Return detailed error information
    return NextResponse.json(
      {
        error: 'Failed to generate authentication URL',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        env: {
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: `${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 10)}...`,
          HAS_GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI,
          HAS_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET
        }
      },
      { status: 500 }
    );
  }
}
