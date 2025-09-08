# Cloud Build Failure Troubleshooting Guide

## Current Issue Analysis

**Build ID**: `60828184-9df6-4dd4-9c05-983914ea91b9`
**Error**: Docker build step failed with exit status 1
**Permission Issue**: Service account lacks logging permissions

## Immediate Steps to Fix

### 1. Check Build Logs

Run this command in Cloud Shell to see detailed build logs:

```bash
# View the specific build logs
gcloud builds log 60828184-9df6-4dd4-9c05-983914ea91b9

# Or view in browser
echo "Build logs: https://console.cloud.google.com/cloud-build/builds/60828184-9df6-4dd4-9c05-983914ea91b9?project=call-centre-471522"
```

### 2. Fix Service Account Permissions

Grant the required logging permissions:

```bash
# Get the project number
PROJECT_NUMBER=$(gcloud projects describe call-centre-471522 --format="value(projectNumber)")

# Grant Logs Writer role to the compute service account
gcloud projects add-iam-policy-binding call-centre-471522 \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/logging.logWriter"

# Grant Cloud Build Service Account role
gcloud projects add-iam-policy-binding call-centre-471522 \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.builder"
```

### 3. Common Docker Build Issues

The Docker build failure could be due to several issues:

#### A. Missing or Invalid Dockerfile
```bash
# Check if Dockerfile exists and is valid
cd eva_eva
ls -la Dockerfile
cat Dockerfile
```

#### B. Missing Dependencies
```bash
# Check if package.json files exist
ls -la package.json
ls -la apps/frontend/package.json
```

#### C. Node.js Version Issues
```bash
# Check the Dockerfile for Node.js version compatibility
grep "FROM node" Dockerfile
```

## Fixed Deployment Approach

### Method 1: Simplified Build (Recommended)

Create a simpler cloudbuild.yaml to isolate the issue:

```bash
cat > cloudbuild-simple.yaml << 'EOF'
steps:
  # Build the Docker image with more verbose output
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '--no-cache',
      '-t', 'gcr.io/$PROJECT_ID/eva-calling-center:latest',
      '.'
    ]
    env:
      - 'DOCKER_BUILDKIT=1'

  # Push the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/eva-calling-center:latest']

images:
  - 'gcr.io/$PROJECT_ID/eva-calling-center:latest'

options:
  machineType: 'E2_HIGHCPU_8'
  diskSizeGb: 100
  logging: CLOUD_LOGGING_ONLY

timeout: '1800s'
EOF

# Submit the simplified build
gcloud builds submit --config cloudbuild-simple.yaml .
```

### Method 2: Step-by-Step Manual Build

If the above fails, try building manually:

```bash
# 1. Build Docker image locally in Cloud Shell
docker build -t gcr.io/call-centre-471522/eva-calling-center:latest .

# 2. Push to Container Registry
docker push gcr.io/call-centre-471522/eva-calling-center:latest

# 3. Deploy to Cloud Run manually
gcloud run deploy eva-calling-center \
  --image gcr.io/call-centre-471522/eva-calling-center:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3004 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 100 \
  --set-env-vars "NODE_ENV=production,PORT=3004"
```

### Method 3: Alternative Dockerfile

If there are Node.js issues, try this simplified Dockerfile:

```bash
cat > Dockerfile.simple << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3004

# Start the application
WORKDIR /app/apps/frontend
CMD ["npm", "run", "start"]
EOF

# Build with the simple Dockerfile
docker build -f Dockerfile.simple -t gcr.io/call-centre-471522/eva-calling-center:latest .
```

## Diagnostic Commands

Run these to gather more information:

```bash
# Check project configuration
gcloud config list

# Check enabled APIs
gcloud services list --enabled

# Check IAM policies
gcloud projects get-iam-policy call-centre-471522

# Check Docker daemon
docker version
docker info

# Check available disk space
df -h

# Check memory usage
free -h
```

## Quick Recovery Commands

Copy and paste these commands in sequence:

```bash
# Set project and navigate to directory
export PROJECT_ID="call-centre-471522"
cd eva_eva

# Fix permissions
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/logging.logWriter"

# Try simplified build
cat > cloudbuild-debug.yaml << 'EOF'
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '--no-cache', '-t', 'gcr.io/$PROJECT_ID/eva-calling-center:latest', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/eva-calling-center:latest']
images:
  - 'gcr.io/$PROJECT_ID/eva-calling-center:latest'
timeout: '1800s'
EOF

gcloud builds submit --config cloudbuild-debug.yaml .
```

## Next Steps

1. **Check the build logs first** to understand the exact Docker error
2. **Fix permissions** using the commands above
3. **Try the simplified build** approach
4. **If still failing**, use the manual Docker build method
5. **Contact support** if the issue persists

## Common Solutions

- **Node.js version mismatch**: Update Dockerfile to use Node.js 18 or 20
- **Memory issues**: Increase machine type in cloudbuild.yaml
- **Network issues**: Check if npm install can reach registries
- **File permissions**: Ensure all files are readable in the build context