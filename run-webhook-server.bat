@echo off
echo Starting Simple Webhook Server...
echo.

echo Installing express (the only dependency needed)...
npm install express

echo.
echo Starting webhook server...
node simple-webhook-server.js

pause
