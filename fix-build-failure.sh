#!/bin/bash
# Fix Cloud Build Failure Script for call-centre-471522

set -e

PROJECT_ID="call-centre-471522"
REGION="us-central1"
SERVICE_NAME="eva-calling-center"

echo "🔧 Fixing Cloud Build Issues for $PROJECT_ID"
echo "============================================="

# Set project
gcloud config set project $PROJECT_ID

# Step 1: Fix Service Account Permissions
echo "🔐 Step 1: Fixing service account permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/logging.logWriter" \
    --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.builder" \
    --quiet

echo "✅ Service account permissions updated"

# Step 2: Check Previous Build Logs
echo "📋 Step 2: Checking previous build logs..."
echo "Build logs available at:"
echo "https://console.cloud.google.com/cloud-build/builds/60828184-9df6-4dd4-9c05-983914ea91b9?project=$PROJECT_ID"

# Get build logs
echo "Fetching build logs..."
gcloud builds log 60828184-9df6-4dd4-9c05-983914ea91b9 > build-failure.log 2>&1 || echo "Could not fetch detailed logs"

# Step 3: Verify Repository State
echo "📂 Step 3: Verifying repository state..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found! Creating one..."
    cp Dockerfile.robust Dockerfile
    echo "✅ Dockerfile created from robust template"
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in root!"
    exit 1
fi

if [ ! -f "apps/frontend/package.json" ]; then
    echo "❌ Frontend package.json not found!"
    exit 1
fi

echo "✅ Repository structure verified"

# Step 4: Try Different Build Approaches
echo "🏗️ Step 4: Attempting build with different strategies..."

# Strategy 1: Simplified Cloud Build
echo "Strategy 1: Simplified Cloud Build"
if [ -f "cloudbuild-simple.yaml" ]; then
    echo "Attempting simplified build..."
    if gcloud builds submit --config cloudbuild-simple.yaml . --timeout=1800s; then
        echo "✅ Simplified build succeeded!"
        echo "🌐 Checking service URL..."
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null || echo "Service not ready")
        if [ "$SERVICE_URL" != "Service not ready" ]; then
            echo "✅ Service deployed at: $SERVICE_URL"
            echo "🔍 Health check: $SERVICE_URL/api/health"
            exit 0
        fi
    else
        echo "❌ Simplified build failed, trying strategy 2..."
    fi
fi

# Strategy 2: Manual Docker Build
echo "Strategy 2: Manual Docker Build in Cloud Shell"
echo "Building Docker image manually..."

if docker build -t gcr.io/$PROJECT_ID/eva-calling-center:latest . --no-cache --progress=plain; then
    echo "✅ Docker build succeeded locally"
    
    echo "Pushing to Container Registry..."
    if docker push gcr.io/$PROJECT_ID/eva-calling-center:latest; then
        echo "✅ Image pushed successfully"
        
        echo "Deploying to Cloud Run..."
        if gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/eva-calling-center:latest \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --port 3004 \
            --memory 2Gi \
            --cpu 2 \
            --max-instances 100 \
            --set-env-vars "NODE_ENV=production,PORT=3004" \
            --quiet; then
            
            echo "✅ Manual deployment succeeded!"
            SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
            echo "🌐 Service URL: $SERVICE_URL"
            echo "🔍 Health check: $SERVICE_URL/api/health"
            exit 0
        else
            echo "❌ Cloud Run deployment failed"
        fi
    else
        echo "❌ Image push failed"
    fi
else
    echo "❌ Docker build failed, trying strategy 3..."
fi

# Strategy 3: Alternative Dockerfile
echo "Strategy 3: Using alternative Dockerfile"
if [ -f "Dockerfile.robust" ]; then
    echo "Building with robust Dockerfile..."
    if docker build -f Dockerfile.robust -t gcr.io/$PROJECT_ID/eva-calling-center:latest . --no-cache; then
        echo "✅ Robust Docker build succeeded"
        
        if docker push gcr.io/$PROJECT_ID/eva-calling-center:latest; then
            echo "✅ Image pushed successfully"
            
            if gcloud run deploy $SERVICE_NAME \
                --image gcr.io/$PROJECT_ID/eva-calling-center:latest \
                --region $REGION \
                --platform managed \
                --allow-unauthenticated \
                --port 3004 \
                --memory 2Gi \
                --cpu 2 \
                --max-instances 100 \
                --set-env-vars "NODE_ENV=production,PORT=3004" \
                --quiet; then
                
                echo "✅ Alternative deployment succeeded!"
                SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
                echo "🌐 Service URL: $SERVICE_URL"
                echo "🔍 Health check: $SERVICE_URL/api/health"
                exit 0
            fi
        fi
    fi
fi

echo "❌ All deployment strategies failed"
echo "📋 Diagnostic Information:"
echo "- Check build-failure.log for detailed error logs"
echo "- Verify Node.js version compatibility"
echo "- Check package.json dependencies"
echo "- Ensure sufficient Cloud Shell resources"
echo ""
echo "Manual debugging commands:"
echo "docker build --no-cache --progress=plain -t test-image ."
echo "npm install --legacy-peer-deps"
echo "npm run build"

exit 1