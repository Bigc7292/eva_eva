#!/bin/bash
# Fixed Cloud Shell Deployment Script for call-centre-471522
# This addresses the gcloud builds submit syntax issues

set -e

PROJECT_ID="call-centre-471522"
REGION="us-central1" 
SERVICE_NAME="eva-calling-center"

echo "🚀 EVA Fixed Deployment Script"
echo "Project: $PROJECT_ID"
echo "================================"

# Set project
gcloud config set project $PROJECT_ID

# Enable APIs
echo "📡 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Method 1: Clone repository and build locally (RECOMMENDED)
echo "📥 Method 1: Clone and build locally..."
if [ -d "eva_eva" ]; then
    echo "Repository already exists, pulling latest changes..."
    cd eva_eva
    git pull origin master
else
    echo "Cloning repository..."
    git clone https://github.com/Bigc7292/eva_eva.git
    cd eva_eva
fi

# Verify cloudbuild.yaml exists
if [ ! -f "cloudbuild.yaml" ]; then
    echo "❌ cloudbuild.yaml not found. Creating it..."
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
    echo "✅ Created cloudbuild.yaml"
fi

# Submit build from local directory
echo "🏗️ Submitting build..."
gcloud builds submit --config cloudbuild.yaml .

echo "✅ Build submitted successfully!"

# Get service URL
echo "🌐 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null || echo "Service not yet available")

echo ""
echo "==================================="
echo "✅ Deployment Status:"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
if [ "$SERVICE_URL" != "Service not yet available" ]; then
    echo "URL: $SERVICE_URL"
    echo "Health Check: $SERVICE_URL/api/health"
else
    echo "URL: Will be available after deployment completes"
fi
echo "==================================="
echo ""
echo "📝 Next Steps:"
echo "1. Wait for deployment to complete"
echo "2. Set environment variables in Cloud Run console:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/variables?project=$PROJECT_ID"
echo "3. Test your deployment"
echo "4. Update webhook URLs in VAPI and Supabase"