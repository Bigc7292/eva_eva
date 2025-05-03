FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Install additional dependencies needed for the application
RUN npm install --save date-fns recharts xlsx react-day-picker twilio
RUN npm install --save-dev tailwindcss postcss autoprefixer postcss-import
RUN npm install --save critters

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT=3004 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# Expose the port
EXPOSE 3004

# Start the application in development mode with proper host binding
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
