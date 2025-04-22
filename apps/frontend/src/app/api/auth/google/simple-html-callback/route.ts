import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get authorization code from query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Log all query parameters for debugging
    console.log('Callback query parameters:', Object.fromEntries(searchParams.entries()));

    // Create HTML response with the results
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google OAuth Callback</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: ${error ? '#d32f2f' : '#4285f4'}; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
          .card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
          .success { color: #388e3c; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1>${error ? 'Authentication Error' : 'Authentication Successful'}</h1>

        <div class="card">
          ${error
            ? `<h2 class="error">Error: ${error}</h2>
               <p>There was a problem authenticating with Google.</p>`
            : `<h2 class="success">Success!</h2>
               <p>You have successfully authenticated with Google.</p>
               <p>Authorization code: <code>${code?.substring(0, 10)}...</code></p>`
          }
        </div>

        <div class="card">
          <h2>Request Details</h2>
          <pre>${JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}</pre>
        </div>

        <div class="card">
          <h2>Next Steps</h2>
          <p>You can now:</p>
          <ul>
            <li><a href="/google-test">Return to the test page</a></li>
            <li><a href="/dashboard">Go to the dashboard</a></li>
          </ul>
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
    console.error('Error handling Google callback:', error);
    return NextResponse.json(
      { error: 'Failed to handle callback' },
      { status: 500 }
    );
  }
}
