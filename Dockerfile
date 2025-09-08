FROM node:18-alpine AS deps

# Install dependencies for building native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /workspace

# Copy package files for dependency installation
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages ./packages
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN npm ci --legacy-peer-deps --ignore-scripts

FROM node:18-alpine AS build

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /workspace

# Copy dependencies from previous stage
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages ./packages

# Copy all source code
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

FROM node:18-alpine AS release

# Install runtime dependencies
RUN apk add --no-cache dumb-init wget curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /workspace

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3004

# Copy built application with proper ownership
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/.next ./apps/frontend/.next
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/public ./apps/frontend/public
COPY --from=build --chown=nextjs:nodejs /workspace/apps/frontend/package*.json ./apps/frontend/
COPY --from=build --chown=nextjs:nodejs /workspace/node_modules ./node_modules

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3004

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/api/health || exit 1

# Set working directory to frontend app
WORKDIR /workspace/apps/frontend

# Start the Next.js application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]