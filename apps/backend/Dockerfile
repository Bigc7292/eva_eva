FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT=3001 \
    TZ=Asia/Dubai

# Expose the port
EXPOSE 3001

# Command to run the application
CMD ["node", "src/index.js"]
