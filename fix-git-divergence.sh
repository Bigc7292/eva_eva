#!/bin/bash
# Fix Git Divergence and Deploy EVA Project

set -e

PROJECT_ID="call-centre-471522"
echo "🔧 Fixing Git Divergence and Deploying EVA Project"
echo "=================================================="

# Step 1: Configure git to handle divergent branches
echo "📋 Step 1: Configuring git merge strategy..."
git config pull.rebase false  # Use merge strategy

# Step 2: Force pull the latest changes
echo "📥 Step 2: Pulling latest changes with merge..."
git pull origin master --allow-unrelated-histories

# Alternative: If pull still fails, reset to remote
if [ $? -ne 0 ]; then
    echo "⚠️  Pull failed, resetting to remote state..."
    git fetch origin master
    git reset --hard origin/master
fi

# Step 3: Verify critical files exist
echo "🔍 Step 3: Verifying critical files..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile missing, creating it..."
    cat > Dockerfile << 'EOF'
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /workspace
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/frontend/package*.json ./apps/frontend/
RUN npm ci --legacy-peer-deps --ignore-scripts

FROM node:18-alpine AS build
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages ./packages
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:18-alpine AS release
RUN apk add --no-cache dumb-init wget curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
WORKDIR /workspace
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3004
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/.next ./apps/frontend/.next
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/public ./apps/frontend/public
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/package*.json ./apps/frontend/
COPY --from=build --chown=nextjs:nodejs /workspace/node_modules ./node_modules
USER nextjs
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/api/health || exit 1
WORKDIR /workspace/apps/frontend
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
EOF
    echo "✅ Dockerfile created"
else
    echo "✅ Dockerfile found"
fi

if [ ! -f "cloudbuild.yaml" ]; then
    echo "❌ cloudbuild.yaml missing, creating it..."
    cat > cloudbuild.yaml << 'EOF'
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '--no-cache',
      '--progress=plain',
      '-t', 'gcr.io/$PROJECT_ID/eva-calling-center:$BUILD_ID',
      '-t', 'gcr.io/$PROJECT_ID/eva-calling-center:latest',
      '.'
    ]
    timeout: '1200s'

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/eva-calling-center:$BUILD_ID']
    timeout: '600s'

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/eva-calling-center:latest']
    timeout: '600s'

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
    timeout: '600s'

images:
  - 'gcr.io/$PROJECT_ID/eva-calling-center:$BUILD_ID'
  - 'gcr.io/$PROJECT_ID/eva-calling-center:latest'

options:
  machineType: 'E2_HIGHCPU_8'
  diskSizeGb: 100
  logging: CLOUD_LOGGING_ONLY

timeout: '1800s'
EOF
    echo "✅ cloudbuild.yaml created"
else
    echo "✅ cloudbuild.yaml found"
fi

# Step 4: Fix service account permissions
echo "🔐 Step 4: Fixing service account permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/logging.logWriter" \
    --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/storage.admin" \
    --quiet

# Step 5: Verify project structure
echo "📂 Step 5: Verifying project structure..."
required_files=("package.json" "apps/frontend/package.json" "Dockerfile" "cloudbuild.yaml")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing"
        if [ "$file" = "package.json" ] || [ "$file" = "apps/frontend/package.json" ]; then
            echo "🚨 Critical file missing. This might not be the correct directory."
            echo "Current directory contents:"
            ls -la
            echo "Please ensure you're in the correct project directory."
            exit 1
        fi
    fi
done

# Step 6: Attempt deployment
echo "🚀 Step 6: Attempting deployment..."
echo "Building and deploying EVA project..."

if gcloud builds submit --config cloudbuild.yaml .; then
    echo "✅ Cloud Build deployment successful!"
    
    # Get service URL
    echo "🌐 Getting service URL..."
    SERVICE_URL=$(gcloud run services describe eva-calling-center --region=us-central1 --format="value(status.url)" 2>/dev/null || echo "Service deployment in progress...")
    
    if [ "$SERVICE_URL" != "Service deployment in progress..." ]; then
        echo "🎉 Deployment completed successfully!"
        echo "Service URL: $SERVICE_URL"
        echo "Health Check: $SERVICE_URL/api/health"
        
        # Test the health endpoint
        echo "🔍 Testing health endpoint..."
        if curl -s "$SERVICE_URL/api/health" > /dev/null; then
            echo "✅ Health check passed!"
        else
            echo "⚠️  Health check failed, but service is deployed"
        fi
    else
        echo "⏳ Deployment is still in progress..."
        echo "Check status at: https://console.cloud.google.com/run/detail/us-central1/eva-calling-center?project=$PROJECT_ID"
    fi
    
else
    echo "❌ Cloud Build failed. Trying manual Docker approach..."
    
    # Fallback: Manual Docker build
    echo "📦 Attempting manual Docker build..."
    if docker build -t gcr.io/$PROJECT_ID/eva-calling-center:latest . --no-cache; then
        echo "✅ Manual Docker build successful"
        
        echo "📤 Pushing to Container Registry..."
        if docker push gcr.io/$PROJECT_ID/eva-calling-center:latest; then
            echo "✅ Image pushed successfully"
            
            echo "🚀 Deploying to Cloud Run..."
            if gcloud run deploy eva-calling-center \
                --image gcr.io/$PROJECT_ID/eva-calling-center:latest \
                --region us-central1 \
                --platform managed \
                --allow-unauthenticated \
                --port 3004 \
                --memory 2Gi \
                --cpu 2 \
                --max-instances 100 \
                --set-env-vars "NODE_ENV=production,PORT=3004"; then
                
                echo "✅ Manual deployment successful!"
                SERVICE_URL=$(gcloud run services describe eva-calling-center --region=us-central1 --format="value(status.url)")
                echo "🌐 Service URL: $SERVICE_URL"
                echo "🔍 Health Check: $SERVICE_URL/api/health"
            else
                echo "❌ Cloud Run deployment failed"
            fi
        else
            echo "❌ Image push failed"
        fi
    else
        echo "❌ Manual Docker build failed"
        echo "📋 Build logs and troubleshooting:"
        echo "1. Check if all package.json files exist"
        echo "2. Verify Node.js dependencies"
        echo "3. Check build logs for specific errors"
    fi
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Set environment variables in Cloud Run console:"
echo "   https://console.cloud.google.com/run/detail/us-central1/eva-calling-center/variables?project=$PROJECT_ID"
echo "2. Configure your Supabase, VAPI, and Twilio credentials"
echo "3. Test your application endpoints"
echo "4. Update webhook URLs in your external services"

echo ""
echo "✅ Git divergence issue resolved and deployment attempted!"