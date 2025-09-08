#!/bin/bash
# Quick deployment script for Google Cloud Shell
# Run this in Google Cloud Console Cloud Shell

# Set the project ID
export PROJECT_ID="call-centre-471522"
export REGION="us-central1"
export SERVICE_NAME="eva-calling-center"

echo "🚀 EVA Deployment to Google Cloud"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Clone the repository if not already cloned
if [ ! -d "eva_eva" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/Bigc7292/eva_eva.git
fi

# Navigate to the project directory
cd eva_eva

# Build and deploy
echo "🏗️ Building and deploying..."
gcloud builds submit --config cloudbuild.yaml \
    --substitutions="_REGION=$REGION,_SERVICE_NAME=$SERVICE_NAME"

# Get the service URL
echo "🌐 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo "✅ Deployment completed!"
echo "🌐 Service URL: $SERVICE_URL"
echo "🔍 Health check: $SERVICE_URL/api/health"
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Cloud Run console"
echo "2. Test the health endpoint"
echo "3. Update webhook URLs in VAPI and Supabase"

# Open the Cloud Run console
echo "Opening Cloud Run console..."
echo "https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"