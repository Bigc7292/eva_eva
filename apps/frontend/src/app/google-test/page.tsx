'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GoogleTestPage() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Not connected');
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  // Client ID from your Google Cloud Console
  const CLIENT_ID = '889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com';
  // Use the simple HTML callback which is guaranteed to work
  const REDIRECT_URI = 'https://7ffc-91-73-200-83.ngrok-free.app/api/auth/google/simple-html-callback';

  // Function to handle direct OAuth flow
  const handleDirectAuth = (customRedirectUri?: string, minimalScope = false) => {
    try {
      // Use minimal scope if requested
      const scopes = minimalScope
        ? ['https://www.googleapis.com/auth/calendar.readonly']
        : [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
          ];

      const redirectUri = customRedirectUri || REDIRECT_URI;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;

      // Log the URL for debugging
      console.log('Auth URL:', authUrl);
      setDebugInfo({ authUrl, redirectUri, scopes });

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error initiating Google auth:', err);
      setError(`Failed to connect to Google Calendar: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Function to handle auth with original callback
  const handleOriginalAuth = () => {
    handleDirectAuth('https://7ffc-91-73-200-83.ngrok-free.app/api/auth/google/simple-html-callback');
  };

  // Function to handle auth with minimal scope
  const handleMinimalAuth = () => {
    handleDirectAuth(undefined, true);
  };

  // Function to handle auth with email scope only
  const handleEmailAuth = () => {
    try {
      const scopes = ['email', 'profile'];
      const redirectUri = 'https://7ffc-91-73-200-83.ngrok-free.app/api/auth/google/simple-html-callback';

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;

      console.log('Email Auth URL:', authUrl);
      setDebugInfo({ authUrl, redirectUri, scopes });

      window.location.href = authUrl;
    } catch (err) {
      console.error('Error initiating Google auth with email scope:', err);
      setError(`Failed to connect to Google: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Function to check if we're coming back from OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    const reasonParam = urlParams.get('reason');

    if (authParam === 'success') {
      setStatus('Connected successfully');
    } else if (authParam === 'error') {
      setStatus('Connection failed');
      setError(reasonParam || 'Unknown error');
    }

    // Collect debug info
    setDebugInfo({
      currentUrl: window.location.href,
      origin: window.location.origin,
      redirectUri: REDIRECT_URI,
      clientId: CLIENT_ID,
      urlParams: Object.fromEntries(urlParams.entries())
    });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Google Calendar API Test Page</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <Button
            onClick={() => handleDirectAuth()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Connect with Simple Callback
          </Button>

          <Button
            onClick={handleOriginalAuth}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Connect with Original Callback
          </Button>

          <Button
            onClick={handleMinimalAuth}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Connect with Minimal Scope (Read-only)
          </Button>

          <Button
            onClick={handleEmailAuth}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Connect with Email Scope Only
          </Button>

          <div className="text-sm text-gray-600 mt-2">
            <p><strong>Simple Callback:</strong> {`${window.location.origin}/api/auth/google/simple-callback`}</p>
            <p><strong>Original Callback:</strong> {`${window.location.origin}/api/auth/google/callback`}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}
