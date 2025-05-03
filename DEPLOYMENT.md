# Deployment Guide for TopLoader Agent AI

This guide provides instructions for deploying the TopLoader Agent AI application to Vercel (frontend) and Railway (backend).

## Prerequisites

1. Create accounts on:
   - [Vercel](https://vercel.com)
   - [Railway](https://railway.app)
   - [GitHub](https://github.com) (if you don't already have one)

2. Make sure you have the following API keys and credentials:
   - Vapi API keys (public and private)
   - Twilio account credentials
   - Supabase URL and anon key
   - Google API keys (if using Google Calendar integration)

## Deployment Steps

### 1. Deploy Backend to Railway

1. Log in to [Railway](https://railway.app)
2. Click "New Project" and select "Deploy from GitHub repo"
3. Select your repository and the `apps/backend` directory
4. Configure the following environment variables in Railway:
   ```
   PORT=3001
   NODE_ENV=production
   TZ=Asia/Dubai
   VAPI_PUBLIC_API_KEY=your_vapi_public_api_key
   VAPI_ASSISTANT_ID=cfaa163c-4a47-471b-a39e-95c12d0cb738
   VAPI_PRIVATE_API_KEY=your_vapi_private_api_key
   VAPI_API_URL=https://api.vapi.ai
   VAPI_PHONE_NUMBER_ID=53cb46fd-5e37-4860-8668-7594005f872a
   VAPI_WEBHOOK_URL=https://api.toploaderagentai.com/webhooks/vapi
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+15637245039
   SUPABASE_URL=https://stexfwbuwyyfmkmxcftv.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   FRONTEND_URL=https://toploaderagentai.com
   ALLOWED_ORIGINS=https://toploaderagentai.com,https://www.toploaderagentai.com
   ```
5. Deploy the backend
6. Set up a custom domain for your backend API (e.g., `api.toploaderagentai.com`)

### 2. Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New" and select "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `apps/frontend`
5. Configure the following environment variables in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://api.toploaderagentai.com
   NEXT_PUBLIC_VAPI_API_KEY=your_vapi_public_api_key
   NEXT_PUBLIC_VAPI_ASSISTANT_ID=cfaa163c-4a47-471b-a39e-95c12d0cb738
   NEXT_PRIVATE_VAPI_API_KEY=your_vapi_private_api_key
   NEXT_PUBLIC_VAPI_API_URL=https://api.vapi.ai
   NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID=53cb46fd-5e37-4860-8668-7594005f872a
   NEXT_PUBLIC_WEBHOOK_URL=https://api.toploaderagentai.com/webhooks/vapi
   NEXT_PUBLIC_APP_URL=https://toploaderagentai.com
   NEXT_PUBLIC_SUPABASE_URL=https://stexfwbuwyyfmkmxcftv.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```
6. Deploy the frontend
7. Set up your custom domain (e.g., `toploaderagentai.com`)

### 3. Update VAPI Webhook URL

After deploying both the frontend and backend, you need to update the VAPI webhook URL to use your custom domain:

1. Run the `update-custom-webhook.js` script with your custom domain:
   ```
   npm run vapi:custom-webhook
   ```

2. Test the webhook to make sure it's working properly:
   ```
   npm run vapi:test-webhook
   ```

### 4. DNS Configuration

1. Set up an A record for your domain pointing to Vercel
2. Set up a CNAME record for `api.toploaderagentai.com` pointing to Railway

## Troubleshooting

If you encounter any issues during deployment, check the following:

1. Make sure all environment variables are correctly set
2. Check the deployment logs in Vercel and Railway
3. Verify that your DNS records are properly configured
4. Test the webhook endpoint to ensure it's receiving events from VAPI

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [VAPI Documentation](https://docs.vapi.ai)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
