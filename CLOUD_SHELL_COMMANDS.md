# Cloud Shell Commands - Step by Step

Copy and paste these commands one by one in Google Cloud Shell:

## Step 1: Set up project and enable APIs

```bash
# Set project ID
export PROJECT_ID="call-centre-471522"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 2: Clone repository

```bash
# Clone the repository
git clone https://github.com/Bigc7292/eva_eva.git
cd eva_eva
```

## Step 3: Verify cloudbuild.yaml exists

```bash
# Check if cloudbuild.yaml exists
ls -la cloudbuild.yaml
```

If it doesn't exist, create it:

```bash
cat > cloudbuild.yaml << 'EOF'
steps:
  # Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/$PROJECT_ID/eva-calling-center:$BUILD_ID',
      '-t', 'gcr.io/$PROJECT_ID/eva-calling-center:latest',
      '--build-arg', 'NODE_ENV=production',
      '.'
    ]

  # Push the Docker images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/eva-calling-center:$BUILD_ID']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/eva-calling-center:latest']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'eva-calling-center',
      '--image', 'gcr.io/$PROJECT_ID/eva-calling-center:latest',
      '--region', 'us-central1',
      '--platform', 'managed',
      '--allow-unauthenticated',
      '--port', '3004',
      '--memory', '2Gi',
      '--cpu', '2',
      '--max-instances', '100',
      '--set-env-vars', 'NODE_ENV=production,PORT=3004'
    ]

images:
  - 'gcr.io/$PROJECT_ID/eva-calling-center:$BUILD_ID'
  - 'gcr.io/$PROJECT_ID/eva-calling-center:latest'

options:
  machineType: 'E2_HIGHCPU_8'
  diskSizeGb: 100
  logging: CLOUD_LOGGING_ONLY

timeout: '1800s'
EOF
```

## Step 4: Submit the build

```bash
# Submit build from current directory (NOT from GitHub URL)
gcloud builds submit --config cloudbuild.yaml .
```

## Step 5: Check deployment status

```bash
# Check if service was deployed
gcloud run services describe eva-calling-center --region=us-central1

# Get service URL
gcloud run services describe eva-calling-center --region=us-central1 --format="value(status.url)"
```

## Alternative: Manual Build and Deploy

If the above doesn't work, try manual steps:

### Build only:
```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/eva-calling-center:latest .
```

### Deploy manually:
```bash
gcloud run deploy eva-calling-center \
  --image gcr.io/$PROJECT_ID/eva-calling-center:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3004 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 100 \
  --set-env-vars "NODE_ENV=production,PORT=3004"
```

## Troubleshooting

### If you get "revision required" error:
- Don't use GitHub URL with gcloud builds submit
- Always clone the repository first and submit from local directory

### If you get "cloudbuild.yaml not found":
- Make sure you're in the eva_eva directory
- Create the cloudbuild.yaml file using the command above

### If build fails:
```bash
# Check build logs
gcloud builds log --help
# Or check in Cloud Console: https://console.cloud.google.com/cloud-build/builds
```

### Environment Variables Setup:
After deployment, set your environment variables:
```bash
# Open Cloud Run console
echo "Set environment variables at:"
echo "https://console.cloud.google.com/run/detail/us-central1/eva-calling-center/variables?project=$PROJECT_ID"
```