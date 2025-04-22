# Google Calendar API Integration Setup

This guide provides step-by-step instructions for setting up the Google Calendar API integration with your application.

## Prerequisites

- Google Cloud Platform account
- Access to the Google Cloud Console
- Your application running locally or deployed

## Step 1: Configure Environment Variables

Add the following environment variables to your `.env` file:

```
# Google Calendar API Configuration
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyA66k97dVoIORhpcWqOxB65B1tJfxFCPBQ
NEXT_PUBLIC_GOOGLE_CLIENT_ID=974252402471-64efp7elfchr9rlbk7ovgm8q8gnuah1g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3004/api/auth/google/callback
```

## Step 2: Create the Database Table

Run the following SQL script in your Supabase database to create the necessary table for storing OAuth tokens:

```sql
-- Create a table for storing Google Calendar OAuth tokens
CREATE TABLE IF NOT EXISTS user_calendar_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_calendar_tokens_user_id ON user_calendar_tokens(user_id);

-- Enable RLS
ALTER TABLE user_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Users can only access their own tokens"
  ON user_calendar_tokens
  FOR ALL
  USING (auth.uid() = user_id);
```

You can run this script using the Supabase SQL Editor or by using the `create_calendar_tokens_table.sql` file provided.

## Step 3: Configure Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Make sure the Google Calendar API is enabled:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable" if it's not already enabled
5. Configure the OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Fill in the required information
   - Add the following scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Add your email as a test user
6. Configure the OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add your redirect URI: `http://localhost:3004/api/auth/google/callback`
   - Click "Create"

## Step 4: Using the Google Calendar Integration

The integration is now set up and ready to use. Here's how to use it:

1. Navigate to the dashboard and go to the "Meetings" tab
2. Click the "Connect Calendar" button to authenticate with Google
3. After authentication, your Google Calendar events will be displayed
4. You can create, view, and manage events directly from the dashboard

## Troubleshooting

If you encounter any issues:

1. Check that all environment variables are correctly set
2. Ensure the Google Calendar API is enabled in your Google Cloud Console
3. Verify that the redirect URI is correctly configured
4. Check the browser console for any error messages
5. Make sure your application is running on the correct port (3004)

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google API Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
