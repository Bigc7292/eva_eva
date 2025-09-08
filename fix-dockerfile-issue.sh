#!/bin/bash
# Quick fix for missing Dockerfile issue in Cloud Shell

set -e

PROJECT_ID="call-centre-471522"
echo "🔧 Fixing Missing Dockerfile Issue for $PROJECT_ID"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the correct project directory"
    echo "Please run: cd eva_eva"
    exit 1
fi

# Pull latest changes that include the Dockerfile
echo "📥 Pulling latest changes with Dockerfile..."
git pull origin master

# Verify Dockerfile now exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile still missing after git pull"
    echo "Creating Dockerfile manually..."
    
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

    echo "✅ Dockerfile created manually"
fi

# Verify required files exist
echo "🔍 Verifying project structure..."
if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile found"
else
    echo "❌ Dockerfile missing"
    exit 1
fi

if [ -f "cloudbuild.yaml" ]; then
    echo "✅ cloudbuild.yaml found"
else
    echo "❌ cloudbuild.yaml missing"
    exit 1
fi

if [ -f "apps/frontend/package.json" ]; then
    echo "✅ Frontend package.json found"
else
    echo "❌ Frontend package.json missing"
    exit 1
fi

# Fix permissions if needed
echo "🔧 Fixing service account permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/logging.logWriter" \
    --quiet

# Now try the build again
echo "🏗️ Attempting Docker build..."
if gcloud builds submit --config cloudbuild.yaml .; then
    echo "✅ Build successful!"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe eva-calling-center --region=us-central1 --format="value(status.url)" 2>/dev/null || echo "Deployment in progress...")
    echo "🌐 Service URL: $SERVICE_URL"
    if [ "$SERVICE_URL" != "Deployment in progress..." ]; then
        echo "🔍 Health check: $SERVICE_URL/api/health"
    fi
else
    echo "❌ Build failed. Trying manual Docker approach..."
    
    # Manual Docker build as fallback
    echo "📦 Building Docker image manually..."
    if docker build -t gcr.io/$PROJECT_ID/eva-calling-center:latest .; then
        echo "✅ Manual Docker build successful"
        
        echo "📤 Pushing image to registry..."
        docker push gcr.io/$PROJECT_ID/eva-calling-center:latest
        
        echo "🚀 Deploying to Cloud Run..."
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
        
        echo "✅ Manual deployment completed!"
        SERVICE_URL=$(gcloud run services describe eva-calling-center --region=us-central1 --format="value(status.url)")
        echo "🌐 Service URL: $SERVICE_URL"
        echo "🔍 Health check: $SERVICE_URL/api/health"
    else
        echo "❌ Manual Docker build also failed"
        echo "📋 Please check the build logs for specific errors"
    fi
fi

echo "🎉 Dockerfile issue resolution complete!"