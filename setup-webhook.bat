@echo off
echo Setting up VAPI webhook...
echo.

echo Installing required packages...
npm install express node-fetch

echo.
echo Starting webhook setup...
node webhook-setup-mcp.js

pause
