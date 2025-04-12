#!/bin/bash

# Clean up
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -rf apps/*/.next

# Create necessary directories
mkdir -p apps/frontend/src/{app,components,hooks,lib,styles,types,utils}
mkdir -p apps/backend/src/services
mkdir -p packages/{ui,config,eslint-config,tsconfig}

# Install dependencies
npm install

# Copy env files if they don't exist
[ ! -f .env ] && cp .env.example .env
[ ! -f apps/backend/.env ] && cp apps/backend/.env.example apps/backend/.env

# Build packages
npm run build

# Start development server
npm run dev