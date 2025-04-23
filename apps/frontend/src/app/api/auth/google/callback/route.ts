import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { calendarService } from '@/lib/services/calendar-service';
import { googleAuthService } from '@/lib/services/google-auth-service';

export async function GET(request: NextRequest) {
  try {
    // Get authorization code from query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Log all query parameters for debugging
    console.log('Callback query parameters:', Object.fromEntries(searchParams.entries()));

    // Check for error parameter
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard?tab=meetings&auth=error&reason=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    // Use hardcoded redirect URI with ngrok URL
    const redirectUri = 'https://7ffc-91-73-200-83.ngrok-free.app/api/auth/google/callback';
    console.log('Using redirect URI:', redirectUri);

    // Exchange code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: '889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com',
        client_secret: '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',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    // Log response status for debugging
    console.log('Token exchange response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: Record<string, unknown>;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { text: errorText };
      }
      console.error('Error exchanging code for tokens:', errorData);
      return NextResponse.redirect(
        new URL(`/dashboard?tab=meetings&auth=error&reason=${encodeURIComponent(JSON.stringify(errorData))}`, request.url)
      );
    }

    // Get tokens from response
    const tokens = await response.json();
    console.log('Received tokens:', { ...tokens, access_token: '***REDACTED***' });

    // Add expiry date if not present
    if (!tokens.expiry_date) {
      tokens.expiry_date = Date.now() + (tokens.expires_in || 3600) * 1000;
    }

    // Store tokens in localStorage via the service
    googleAuthService.storeTokens(tokens);

    // Also store in the calendar service
    await calendarService.storeTokens(tokens);

    // Log success
    console.log('Successfully authenticated with Google Calendar');

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL('/dashboard?tab=meetings&auth=success', request.url)
    );
  } catch (error) {
    console.error('Error handling Google callback:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.redirect(
      new URL(`/dashboard?tab=meetings&auth=error&reason=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
