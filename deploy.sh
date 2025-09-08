#!/bin/bash

# EVA Cloud Deployment Script
# This script deploys the EVA calling center to Google Cloud Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 EVA Cloud Deployment Script${NC}"
echo "================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No Google Cloud project is configured.${NC}"
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}📋 Project ID: ${PROJECT_ID}${NC}"

# Ask for region
read -p "Enter your preferred region (default: us-central1): " REGION
REGION=${REGION:-us-central1}

# Ask for service name
read -p "Enter service name (default: eva-calling-center): " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-eva-calling-center}

echo -e "${YELLOW}🔧 Configuration:${NC}"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo ""

read -p "Continue with deployment? (y/N): " CONFIRM
if [[ $CONFIRM != [yY] ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo -e "${YELLOW}🏗️  Building and deploying...${NC}"

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "Starting Cloud Build..."
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_REGION=$REGION,_SERVICE_NAME=$SERVICE_NAME

echo -e "${GREEN}✅ Deployment completed!${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo -e "${GREEN}🌐 Your service is available at: ${SERVICE_URL}${NC}"
echo -e "${YELLOW}📝 Don't forget to:${NC}"
echo "  1. Set your environment variables in Cloud Run console"
echo "  2. Update your Supabase and VAPI webhook URLs"
echo "  3. Test the health endpoint: ${SERVICE_URL}/api/health"

# Optionally open the service URL
read -p "Open the service URL in your browser? (y/N): " OPEN_URL
if [[ $OPEN_URL == [yY] ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "$SERVICE_URL"
    elif command -v open &> /dev/null; then
        open "$SERVICE_URL"
    else
        echo "Please open $SERVICE_URL in your browser"
    fi
fi