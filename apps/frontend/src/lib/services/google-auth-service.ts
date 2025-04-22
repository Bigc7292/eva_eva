import { supabase } from './supabase';

// Store tokens in local storage with a prefix to avoid conflicts
const TOKEN_STORAGE_KEY = 'google_calendar_tokens';

export const googleAuthService = {
  // Generate OAuth URL for user authentication
  getAuthUrl() {
    // Hardcoded client ID and redirect URI
    const clientId = '889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:3004/api/auth/google/callback';

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
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  },

  // Get tokens from local storage
  getTokens() {
    const tokensStr = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokensStr) return null;

    try {
      return JSON.parse(tokensStr);
    } catch (error) {
      console.error('Error parsing tokens:', error);
      return null;
    }
  },

  // Clear tokens from local storage
  clearTokens() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
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
