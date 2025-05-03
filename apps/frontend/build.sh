#!/bin/bash

# Install dependencies
npm install

# Run the fix-imports script to ensure all imports are correct
node fix-imports.js

# Run the Next.js build
next build
