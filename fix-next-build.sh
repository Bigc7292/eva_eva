#!/bin/bash
# Fix Next.js build issue in Docker

set -e

PROJECT_ID="call-centre-471522"
echo "🔧 Fixing Next.js Build Issue"
echo "============================="

# Check if apps/frontend/package-lock.json exists
if [ ! -f "apps/frontend/package-lock.json" ]; then
    echo "📦 Generating package-lock.json for frontend..."
    cd apps/frontend
    npm install --package-lock-only
    cd ../..
fi

# Method 1: Try with fixed Dockerfile focusing on monorepo
echo "🐳 Method 1: Trying fixed monorepo Dockerfile..."
cat > Dockerfile.temp << 'EOF'
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /workspace

# Copy package files and install root dependencies
COPY package*.json ./
COPY turbo.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy and install frontend dependencies
COPY apps/frontend/package*.json ./apps/frontend/
WORKDIR /workspace/apps/frontend
RUN npm ci --legacy-peer-deps

FROM node:18-alpine AS build
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /workspace

# Copy dependencies
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy source
COPY . .

# Build with explicit path
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /workspace/apps/frontend
RUN npx next build

FROM node:18-alpine AS release
RUN apk add --no-cache dumb-init wget curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3004

COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/.next ./.next
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/public ./public
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/package*.json ./
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/node_modules ./node_modules

USER nextjs
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/api/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
EOF

# Try building with the fixed Dockerfile
if docker build -f Dockerfile.temp -t gcr.io/$PROJECT_ID/eva-calling-center:latest .; then
    echo "✅ Fixed Dockerfile build successful!"
    
    # Replace the original Dockerfile
    mv Dockerfile.temp Dockerfile
    
    echo "📤 Pushing image..."
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
            
            echo "✅ Deployment successful!"
            SERVICE_URL=$(gcloud run services describe eva-calling-center --region=us-central1 --format="value(status.url)")
            echo "🌐 Service URL: $SERVICE_URL"
            echo "🔍 Health Check: $SERVICE_URL/api/health"
            exit 0
        fi
    fi
else
    echo "❌ Fixed Dockerfile failed, trying simple approach..."
    rm -f Dockerfile.temp
fi

# Method 2: Simple frontend-only approach
echo "🐳 Method 2: Trying simple frontend-only Dockerfile..."
cat > Dockerfile.simple << 'EOF'
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY apps/frontend/package*.json ./
RUN npm ci --legacy-peer-deps

FROM node:18-alpine AS build
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/frontend ./
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:18-alpine AS release
RUN apk add --no-cache dumb-init wget curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3004
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/package*.json ./
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
USER nextjs
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/api/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
EOF

if docker build -f Dockerfile.simple -t gcr.io/$PROJECT_ID/eva-calling-center:latest .; then
    echo "✅ Simple Dockerfile build successful!"
    
    # Replace the original Dockerfile
    mv Dockerfile.simple Dockerfile
    
    echo "📤 Pushing image..."
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
            
            echo "✅ Deployment successful!"
            SERVICE_URL=$(gcloud run services describe eva-calling-center --region=us-central1 --format="value(status.url)")
            echo "🌐 Service URL: $SERVICE_URL"
            echo "🔍 Health Check: $SERVICE_URL/api/health"
            exit 0
        fi
    fi
else
    echo "❌ Simple Dockerfile also failed"
    rm -f Dockerfile.simple
fi

# Method 3: Debug and manual fix
echo "🔍 Method 3: Debugging the issue..."
echo "Checking frontend package.json dependencies..."
if [ -f "apps/frontend/package.json" ]; then
    echo "Next.js version:"
    grep '"next"' apps/frontend/package.json || echo "Next.js not found in dependencies"
    
    echo "All dependencies:"
    cat apps/frontend/package.json | grep -A 20 '"dependencies"'
else
    echo "❌ Frontend package.json not found"
fi

echo ""
echo "📋 Manual fix needed:"
echo "1. Check if Next.js is properly listed in apps/frontend/package.json"
echo "2. Ensure package-lock.json exists in frontend directory"
echo "3. Consider running: cd apps/frontend && npm install"
echo "4. Verify the build works locally: cd apps/frontend && npm run build"

exit 1