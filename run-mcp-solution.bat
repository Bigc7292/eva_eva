@echo off
echo Starting MCP Webhook Solution...
echo.

echo Installing required packages...
npm install express node-fetch playwright

echo.
echo Starting MCP Webhook Solution...
node mcp-webhook-solution.js

pause
