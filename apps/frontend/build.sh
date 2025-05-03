#!/bin/bash

# Remove conflicting files if they exist
rm -rf src/app/calls/route.ts
rm -rf src/app/calls/page.tsx
rm -rf src/app/calls/[id]/page.tsx

# Install missing type definitions
npm install --save-dev @types/uuid

# Run the Next.js build
next build
