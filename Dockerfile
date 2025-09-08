FROM node:20-alpine AS deps
WORKDIR /workspace

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN npm ci --legacy-peer-deps --ignore-scripts

FROM node:20-alpine AS build
WORKDIR /workspace

# Copy node_modules from deps stage
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy source code
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

FROM node:20-alpine AS release
WORKDIR /workspace

# Install dumb-init and wget for proper signal handling and health checks
RUN apk add --no-cache dumb-init wget

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment
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

# Expose port
EXPOSE 3004

# Set working directory for startup
WORKDIR /workspace/apps/frontend

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/api/health || exit 1

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
