FROM node:20-alpine AS deps
WORKDIR /workspace

# Copy package files
COPY package*.json ./
COPY packages ./packages
COPY apps/frontend/package*.json ./apps/frontend/
COPY turbo.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --ignore-scripts

FROM node:20-alpine AS build
WORKDIR /workspace

# Copy node_modules from deps stage
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build

FROM node:20-alpine AS release
WORKDIR /workspace

# Set environment
ENV NODE_ENV=production
ENV PORT=3004

# Copy built application
COPY --from=build /workspace/apps/frontend/.next ./apps/frontend/.next
COPY --from=build /workspace/apps/frontend/public ./apps/frontend/public
COPY --from=build /workspace/apps/frontend/package*.json ./apps/frontend/
COPY --from=build /workspace/node_modules ./node_modules

# Expose port
EXPOSE 3004

# Set working directory for startup
WORKDIR /workspace/apps/frontend

# Start the application
CMD ["npm", "run", "start"]
