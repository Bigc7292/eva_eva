import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { calendarService } from '@/lib/services/calendar-service';
import { supabase } from '@/lib/services/supabase';

export async function GET() {
  try {
    console.log('Server-side Google Calendar auth check');

    // First, try to get the current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // If we have a user, check for tokens in the database
      const { data: tokenData, error } = await supabase
        .from('user_calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.log('No tokens found in database:', error.message);
      } else if (tokenData) {
        // Check if tokens are still valid (not expired)
        const isExpired = tokenData.expiry_date && new Date(tokenData.expiry_date) < new Date();

        if (!isExpired && tokenData.access_token) {
          console.log('Valid tokens found in database');
          return NextResponse.json({ isAuthenticated: true });
        }
        console.log('Tokens found but expired');
      }
    }

    // As a fallback, check for tokens in cookies
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('google_calendar_tokens');

    if (tokenCookie) {
      try {
        const tokens = JSON.parse(tokenCookie.value);
        const isExpired = tokens.expiry_date && new Date(tokens.expiry_date) < new Date();

        if (!isExpired && tokens.access_token) {
          console.log('Valid tokens found in cookies');
          return NextResponse.json({ isAuthenticated: true });
        }
        console.log('Tokens found in cookies but expired');
      } catch (e) {
        console.error('Error parsing token cookie:', e);
      }
    }

    // If we reach here, no valid tokens were found
    return NextResponse.json({ isAuthenticated: false });
  } catch (error) {
    console.error('Error checking Google auth status:', error);
    // Return false instead of an error to avoid breaking the UI
    return NextResponse.json({ isAuthenticated: false });
  }
}
