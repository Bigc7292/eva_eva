# Docker Setup for EVA CRM

This guide explains how to set up and run the EVA CRM application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine
- Git access to the repository

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Build and start the Docker containers:
   ```bash
   # On Windows
   docker-start.bat
   
   # On Linux/Mac
   chmod +x docker-start.sh
   ./docker-start.sh
   ```

3. Access the application:
   - Frontend: http://localhost:3004
   - Backend: http://localhost:3001

## Manual Setup

If you prefer to set up Docker manually, follow these steps:

1. Create a `.env.docker` file with your environment variables (use the provided `.env.docker` as a template)

2. Build the Docker images:
   ```bash
   docker-compose build
   ```

3. Start the Docker containers:
   ```bash
   docker-compose --env-file .env.docker up -d
   ```

4. Check the running containers:
   ```bash
   docker-compose ps
   ```

5. View the logs:
   ```bash
   docker-compose logs -f
   ```

6. Stop the containers:
   ```bash
   docker-compose down
   ```

## Using npm Scripts

You can also use the npm scripts defined in the root `package.json`:

```bash
# Build the Docker images
npm run docker:build

# Start the Docker containers
npm run docker:up

# View the logs
npm run docker:logs

# Stop the containers
npm run docker:down

# Build and start in one command
npm run docker:start
```

## Docker Compose Configuration

The `docker-compose.yml` file defines two services:

1. **frontend**: The Next.js frontend application
   - Port: 3004
   - Dependencies: backend

2. **backend**: The Express backend application
   - Port: 3001

Both services use environment variables from the `.env.docker` file.

## Environment Variables

The following environment variables are required:

### Frontend Variables
- `NEXT_PUBLIC_API_URL`: URL of the backend API
- `NEXT_PUBLIC_VAPI_API_KEY`: Vapi public API key
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID`: Vapi assistant ID
- `NEXT_PRIVATE_VAPI_API_KEY`: Vapi private API key
- `NEXT_PUBLIC_VAPI_API_URL`: Vapi API URL
- `NEXT_PUBLIC_VAPI_PHONE_NUMBER_ID`: Vapi phone number ID
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

### Backend Variables
- `PORT`: Port for the backend server
- `NODE_ENV`: Environment (development, production)
- `TZ`: Timezone
- `NEXT_PUBLIC_TWILIO_ACCOUNT_SID`: Twilio account SID
- `NEXT_PUBLIC_TWILIO_AUTH_TOKEN`: Twilio auth token
- `NEXT_PUBLIC_TWILIO_PHONE_NUMBER`: Twilio phone number

## Troubleshooting

### Container won't start
- Check logs with `docker-compose logs`
- Verify environment variables in `.env.docker`
- Ensure ports are not in use by other services

### Cannot connect to the application
- Check if containers are running with `docker-compose ps`
- Verify network configuration in `docker-compose.yml`
- Check firewall settings on your machine

For more detailed deployment instructions, see the [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) file.
