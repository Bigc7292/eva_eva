import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate Google OAuth URL with different origins for testing
    const localOrigin = 'http://localhost:3004';
    const envOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

    // Hardcoded client ID
    const clientId = '889823691212-l5ooomrd37jpbisohg1q8vofmupbr3c3.apps.googleusercontent.com';
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    // Generate URLs with different origins
    const localUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(`${localOrigin}/api/auth/google/callback`)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;

    const envUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(`${envOrigin}/api/auth/google/callback`)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;

    // Create HTML response with links
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Calendar API Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #4285f4; }
          .link-card { background: #f1f3f4; padding: 15px; margin: 10px 0; border-radius: 8px; }
          .link-card a { display: block; margin-top: 10px; color: #1a73e8; text-decoration: none; }
          .link-card a:hover { text-decoration: underline; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Google Calendar API Test</h1>

        <div class="link-card">
          <h3>Direct Authentication Link</h3>
          <p>Click this link to authenticate directly with Google:</p>
          <a href="${localUrl}" target="_blank">Authenticate with Google Calendar</a>
        </div>

        <div class="link-card">
          <h3>Environment Information</h3>
          <pre>${JSON.stringify({
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
            HAS_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
            HARDCODED_CLIENT_ID: clientId
          }, null, 2)}</pre>
        </div>

        <div class="link-card">
          <h3>Generated URLs</h3>
          <p><strong>Local URL:</strong></p>
          <pre>${localUrl}</pre>
          <a href="${localUrl}" target="_blank">Open Local URL</a>

          <p><strong>Environment URL:</strong></p>
          <pre>${envUrl}</pre>
          <a href="${envUrl}" target="_blank">Open Environment URL</a>
        </div>
      </body>
      </html>
    `;

    // Return HTML response
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating test URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate test URLs' },
      { status: 500 }
    );
  }
}
