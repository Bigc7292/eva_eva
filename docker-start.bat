@echo off
echo Stopping any running containers...
docker-compose down

echo Building and starting containers...
docker-compose --env-file .env.docker up -d --build

echo Running containers:
docker-compose ps

echo Application is now running!
echo Frontend: http://localhost:3004
echo Backend: http://localhost:3001
pause
