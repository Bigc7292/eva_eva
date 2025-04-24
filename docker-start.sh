#!/bin/bash

# Stop any running containers
echo "Stopping any running containers..."
docker-compose down

# Build and start the containers
echo "Building and starting containers..."
docker-compose --env-file .env.docker up -d --build

# Show running containers
echo "Running containers:"
docker-compose ps

echo "Application is now running!"
echo "Frontend: http://localhost:3004"
echo "Backend: http://localhost:3001"
