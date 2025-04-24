# Docker Deployment Guide

This guide explains how to deploy the application using Docker in various environments.

## Prerequisites

- Docker installed on your server
- Docker Compose installed on your server
- Git access to the repository

## Local Deployment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Create a `.env.docker` file with your environment variables (use `.env.docker` as a template)

3. Run the Docker start script:
   ```bash
   # On Linux/Mac
   chmod +x docker-start.sh
   ./docker-start.sh
   
   # On Windows
   docker-start.bat
   ```

4. Access the application:
   - Frontend: http://localhost:3004
   - Backend: http://localhost:3001

## Production Deployment

For production deployment, follow these additional steps:

1. Update the `.env.docker` file with production values:
   - Set `NODE_ENV=production`
   - Update API keys and secrets
   - Configure production URLs

2. Configure a reverse proxy (Nginx or Traefik) to handle HTTPS:

   Example Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3004;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Set up SSL certificates using Let's Encrypt:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

4. Start the Docker containers:
   ```bash
   ./docker-start.sh
   ```

5. Set up automatic updates and monitoring:
   - Configure Watchtower for automatic container updates
   - Set up Prometheus and Grafana for monitoring
   - Configure log aggregation with ELK stack or similar

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
- Check firewall settings on your server

### Database connection issues
- Verify Supabase connection details
- Check network connectivity from the container to Supabase

## Backup and Restore

### Database Backup
Since we're using Supabase, backups are handled by the Supabase platform.

### Application Backup
To backup your application configuration:
1. Save your `.env.docker` file
2. Backup any custom configurations
3. Commit your code changes to Git

## Scaling

To scale the application:

1. Horizontal scaling:
   ```bash
   docker-compose up -d --scale backend=3
   ```

2. For production-grade scaling, consider using Kubernetes:
   - Convert docker-compose.yml to Kubernetes manifests
   - Deploy to a Kubernetes cluster
   - Set up auto-scaling based on CPU/memory usage
