import { NextResponse } from 'next/server';
import { calendarService } from '@/lib/services/calendar-service';
import { supabase } from '@/lib/services/supabase';

export async function GET() {
  try {
    // Server-side authentication check should use database tokens
    // This is a server-side API route, so localStorage is not available

    // For now, we'll just return false since we can't access localStorage
    // In a production app, you would check for tokens in the database or cookies

    // TODO: Implement server-side token verification with database or cookies
    console.log('Server-side Google Calendar auth check');

    // Return false for now - client-side components should use their own auth check
    return NextResponse.json({ isAuthenticated: false });
  } catch (error) {
    console.error('Error checking Google auth status:', error);
    // Return false instead of an error to avoid breaking the UI
    return NextResponse.json({ isAuthenticated: false });
  }
}
