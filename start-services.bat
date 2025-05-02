@echo off
echo Starting Dia-1.6B Voice Model...
start cmd /k "docker-compose -f docker-compose.dia.yml up"

echo Waiting for Dia-1.6B to initialize (30 seconds)...
timeout /t 30

echo Starting Frontend...
cd apps\frontend
start cmd /k "npm run dev"

echo All services started!
echo.
echo Dia-1.6B Voice Model: http://localhost:7860
echo Frontend: http://localhost:3004
echo.
echo Test the Dia-1.6B integration at: http://localhost:3004/calls/dia-voice
echo.
