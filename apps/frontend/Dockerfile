FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Install additional dependencies needed for the application
RUN npm install --save date-fns recharts xlsx react-day-picker twilio swr
RUN npm install --save-dev tailwindcss postcss autoprefixer postcss-import
RUN npm install --save critters@1.0.0

# Copy the rest of the application
COPY . .

# Disable Next.js optimization for CSS to avoid critters issues
ENV NEXT_DISABLE_OPTIMIZE_CSS=1 \
    PORT=3004 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# Expose the port
EXPOSE 3004

# Start the application in development mode with proper host binding
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
