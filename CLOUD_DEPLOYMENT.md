# EVA Cloud Deployment Guide

This guide helps you deploy the EVA calling center application to Google Cloud Platform.

## Prerequisites

1. Google Cloud Platform account
2. Docker installed locally
3. Google Cloud SDK installed and configured
4. Your project's environment variables configured

## Quick Deployment

### 1. Using Google Cloud Build

The repository includes a `cloudbuild.yaml` file for automatic building and deployment.

```bash
# Build and deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml .
```

This will:
- Build the Docker image
- Push it to Google Container Registry
- Make it available for deployment

### 2. Deploy to Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy eva-calling-center \
  --image gcr.io/YOUR_PROJECT_ID/eva-calling-center:latest \
  --platform managed \
  --region YOUR_REGION \
  --allow-unauthenticated \
  --port 3004 \
  --set-env-vars "NODE_ENV=production"
```

Replace:
- `YOUR_PROJECT_ID` with your Google Cloud project ID
- `YOUR_REGION` with your preferred region (e.g., `us-central1`)

### 3. Environment Variables

Set up your environment variables in Cloud Run:

```bash
gcloud run services update eva-calling-center \
  --set-env-vars "
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url,
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key,
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key,
VAPI_API_KEY=your_vapi_key,
VAPI_PRIVATE_KEY=your_vapi_private_key,
TWILIO_ACCOUNT_SID=your_twilio_sid,
TWILIO_AUTH_TOKEN=your_twilio_token,
NODE_ENV=production,
PORT=3004"
```

## Manual Docker Deployment

### 1. Build the Docker Image

```bash
# Build the image
docker build -t eva-calling-center .

# Tag for Google Container Registry
docker tag eva-calling-center gcr.io/YOUR_PROJECT_ID/eva-calling-center:latest
```

### 2. Push to Container Registry

```bash
# Configure Docker to use gcloud as a credential helper
gcloud auth configure-docker

# Push the image
docker push gcr.io/YOUR_PROJECT_ID/eva-calling-center:latest
```

### 3. Run Locally (for testing)

```bash
# Run the container locally
docker run -p 3004:3004 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key \
  gcr.io/YOUR_PROJECT_ID/eva-calling-center:latest
```

## Environment Configuration

Create a `.env.production` file (not committed to Git) with your production values:

```env
NODE_ENV=production
PORT=3004

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# VAPI Configuration
VAPI_API_KEY=your_vapi_api_key
VAPI_PRIVATE_KEY=your_vapi_private_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app-url.run.app
WEBHOOK_URL=https://your-app-url.run.app/api/webhook
```

## Troubleshooting

### Common Issues

1. **Build fails with "Dockerfile not found"**
   - Ensure your repository has the Dockerfile in the root directory
   - Check that the build context is correct

2. **Environment variables not loading**
   - Verify all required environment variables are set in Cloud Run
   - Check the variable names match exactly

3. **Port binding issues**
   - Ensure your application listens on the PORT environment variable
   - Cloud Run expects the service to listen on the port specified by the PORT environment variable

4. **Database connection issues**
   - Verify Supabase URLs and keys are correct
   - Check that your Supabase project allows connections from Cloud Run

### Monitoring

Check your application logs:

```bash
# View logs
gcloud run services logs eva-calling-center --limit=50

# Follow logs in real-time
gcloud run services logs eva-calling-center --follow
```

## Security Considerations

1. Never commit sensitive environment variables to Git
2. Use Google Secret Manager for sensitive data in production
3. Enable HTTPS and configure proper CORS policies
4. Regular security updates for dependencies

## Scaling

Cloud Run automatically scales based on traffic. Configure scaling settings:

```bash
gcloud run services update eva-calling-center \
  --max-instances=100 \
  --concurrency=1000 \
  --cpu=2 \
  --memory=2Gi
```

## Support

For deployment issues:
1. Check the application logs
2. Verify all environment variables are set correctly
3. Ensure your Supabase database is properly configured
4. Test VAPI and Twilio integrations separately