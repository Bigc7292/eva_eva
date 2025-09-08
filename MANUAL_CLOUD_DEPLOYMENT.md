# Manual Google Cloud Deployment Guide

Since you're encountering permission issues with gcloud CLI, here's how to deploy manually through the Google Cloud Console.

## Project Information
- **Project ID**: call-centre-471522
- **Repository**: https://github.com/Bigc7292/eva_eva

## Step 1: Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project `call-centre-471522`
3. Navigate to **APIs & Services** > **Library**
4. Enable these APIs:
   - **Cloud Build API**
   - **Cloud Run API**
   - **Container Registry API**
   - **Artifact Registry API** (recommended for new projects)

## Step 2: Set up Cloud Build Trigger

1. Go to **Cloud Build** > **Triggers**
2. Click **"Create Trigger"**
3. Configure:
   - **Name**: `eva-deploy-trigger`
   - **Event**: Push to a branch
   - **Source**: Connect your GitHub repository `Bigc7292/eva_eva`
   - **Branch**: `^master$`
   - **Configuration**: Cloud Build configuration file (yaml)
   - **Location**: `cloudbuild.yaml`

## Step 3: Manual Build (Alternative)

If triggers don't work, you can manually submit a build:

1. Go to **Cloud Build** > **History**
2. Click **"Run build"**
3. Choose:
   - **Source**: Repository (connect to GitHub)
   - **Repository**: `Bigc7292/eva_eva`
   - **Branch**: `master`
   - **Build configuration**: `cloudbuild.yaml`

## Step 4: Deploy to Cloud Run

After the build completes:

1. Go to **Cloud Run**
2. Click **"Create Service"**
3. Configure:
   - **Service name**: `eva-calling-center`
   - **Region**: `us-central1` (or your preferred region)
   - **Container image URL**: `gcr.io/call-centre-471522/eva-calling-center:latest`
   - **Port**: `3004`
   - **Memory**: `2 GiB`
   - **CPU**: `2`
   - **Maximum instances**: `100`
   - **Allow unauthenticated invocations**: ✅ (for public access)

## Step 5: Set Environment Variables

In Cloud Run service settings, add these environment variables:

### Required Variables:
```
NODE_ENV=production
PORT=3004
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VAPI_API_KEY=your_vapi_api_key
VAPI_PRIVATE_KEY=your_vapi_private_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Get Your Service URL:
After deployment, your service will be available at:
`https://eva-calling-center-[hash]-uc.a.run.app`

## Step 6: Update Webhook URLs

Update your webhook URLs in:

1. **VAPI Dashboard**:
   - Set webhook URL to: `https://your-service-url/api/webhook`

2. **Supabase Dashboard**:
   - Update any webhook configurations

3. **Twilio Console**:
   - Update webhook URLs if needed

## Health Check

Test your deployment:
- Health endpoint: `https://your-service-url/api/health`
- Main app: `https://your-service-url`

## Troubleshooting

### Common Issues:

1. **Build fails**: Check Cloud Build logs in the console
2. **Service won't start**: Check Cloud Run logs
3. **Environment variables**: Ensure all required vars are set
4. **Permissions**: Make sure the build service account has necessary permissions

### Viewing Logs:

- **Build logs**: Cloud Build > History > Select your build
- **Runtime logs**: Cloud Run > Your service > Logs tab

## Alternative: Using Cloud Shell

If you prefer command line but have permission issues:

1. Open [Cloud Shell](https://shell.cloud.google.com)
2. Clone your repository:
   ```bash
   git clone https://github.com/Bigc7292/eva_eva.git
   cd eva_eva
   ```
3. Run the deployment:
   ```bash
   gcloud builds submit --config cloudbuild.yaml .
   ```

Cloud Shell runs with the project's default service account and should have the necessary permissions.