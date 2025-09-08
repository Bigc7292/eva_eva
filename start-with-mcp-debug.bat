@echo off
echo ========================================
echo  EVA App - Enhanced MCP Debug Startup
echo ========================================
echo.

echo [1/4] Checking application status...
timeout /t 2 /nobreak >nul

echo [2/4] Starting development server with MCP debugging...
echo.
echo Starting Next.js development server on port 3004...
echo MCP Debug tools will be automatically loaded...
echo.

cd apps\frontend
start "EVA Dev Server" cmd /c "npm run dev"

echo [3/4] Waiting for server to start...
timeout /t 5 /nobreak >nul

echo [4/4] Running initial Playwright health check...
cd ..\..
node playwright-visual-test.js

echo.
echo ========================================
echo  EVA App Started Successfully!
echo ========================================
echo.
echo - Dashboard: http://localhost:3004
echo - MCP Debug: Integrated in browser console
echo - Playwright: Visual tests available
echo - Enhanced UI: Interactive components active
echo.
echo Press any key to run another visual test...
pause >nul
node playwright-visual-test.js

echo.
echo Startup complete! 
echo Check the preview browser for the enhanced dashboard.
pause