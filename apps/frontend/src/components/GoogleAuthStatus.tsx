'use client';

import { useState, useEffect } from 'react';
import { googleAuthService } from '@/lib/services/google-auth-service';

export default function GoogleAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication status on the client side
    const checkAuth = () => {
      try {
        const authStatus = googleAuthService.isAuthenticated();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Google Calendar Status</h3>
      {loading ? (
        <p>Checking authentication status...</p>
      ) : (
        <p>
          Status: {isAuthenticated ? (
            <span className="text-green-600 font-medium">Connected</span>
          ) : (
            <span className="text-red-600 font-medium">Not Connected</span>
          )}
        </p>
      )}
      {!isAuthenticated && (
        <a 
          href="/api/auth/google"
          className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect to Google Calendar
        </a>
      )}
    </div>
  );
}
