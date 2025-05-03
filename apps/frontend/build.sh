#!/bin/bash

# Remove conflicting files if they exist
rm -rf src/app/calls/route.ts
rm -rf src/app/calls/page.tsx
rm -rf src/app/calls/[id]/page.tsx

# Make the installation script executable and run it
chmod +x install-deps.sh
./install-deps.sh

# Run the fix-imports script to update import statements
node fix-imports.js

# Run the Next.js build
next build
