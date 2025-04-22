import { NextResponse } from 'next/server';
import { calendarService } from '@/lib/services/calendar-service';

export async function GET() {
  try {
    // Check if user is authenticated with Google Calendar
    const isAuthenticated = calendarService.isAuthenticated();

    console.log('Google Calendar auth status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');

    return NextResponse.json({ isAuthenticated });
  } catch (error) {
    console.error('Error checking Google auth status:', error);
    // Return false instead of an error to avoid breaking the UI
    return NextResponse.json({ isAuthenticated: false });
  }
}
