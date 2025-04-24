import { supabase } from './supabase';

// Store tokens in local storage with a prefix to avoid conflicts
const TOKEN_STORAGE_KEY = 'google_calendar_tokens';

export const googleAuthService = {
  // Generate OAuth URL for user authentication
  getAuthUrl() {
    // Hardcoded client ID and redirect URI with ngrok URL
    const clientId = '889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com';
    const redirectUri = 'https://7ffc-91-73-200-83.ngrok-free.app/api/auth/google/simple-html-callback';

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    // Create URL directly with template literals
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;

    return authUrl;
  },

  // Check if user is authenticated
  isAuthenticated() {
    const tokens = this.getTokens();
    return !!tokens && !!tokens.access_token;
  },

  // Store tokens in local storage
  storeTokens(tokens: Record<string, unknown>) {
    // Check if localStorage is available (client-side only)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } else {
      console.warn('localStorage not available, unable to store tokens');
    }
  },

  // Get tokens from local storage
  getTokens() {
    // Check if localStorage is available (client-side only)
    if (typeof window !== 'undefined' && window.localStorage) {
      const tokensStr = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!tokensStr) return null;

      try {
        return JSON.parse(tokensStr);
      } catch (error) {
        console.error('Error parsing tokens:', error);
        return null;
      }
    } else {
      console.warn('localStorage not available, unable to retrieve tokens');
      return null;
    }
  },

  // Clear tokens from local storage
  clearTokens() {
    // Check if localStorage is available (client-side only)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      console.warn('localStorage not available, unable to clear tokens');
    }
  },

  // Store tokens in database for server-side access
  async storeTokensInDatabase(tokens: Record<string, unknown>) {
    try {
      // Try to get the current user
      const { data: { user } } = await supabase.auth.getUser();

      // If user is not authenticated with Supabase, just store in localStorage
      if (!user) {
        console.log('No authenticated user found, storing tokens in localStorage only');
        return true;
      }

      // Store tokens in database
      const { error } = await supabase
        .from('user_calendar_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date || (Date.now() + 3600 * 1000) // Default expiry 1 hour from now
        });

      if (error) {
        console.error('Supabase error storing tokens:', error);
        // Continue even if there's an error with the database
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error storing tokens in database:', error);
      // Return true anyway to not block the auth flow
      return true;
    }
  }
};
