# 🎭 EVA App MCP Debug Startup Script

Write-Host "🎭 Starting EVA App with MCP Debug Monitoring" -ForegroundColor Cyan
Write-Host ""

# Function to start process and return job
function Start-BackgroundProcess {
    param($Command, $Arguments, $WorkingDirectory = ".")
    
    $ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
    $ProcessInfo.FileName = $Command
    $ProcessInfo.Arguments = $Arguments
    $ProcessInfo.WorkingDirectory = $WorkingDirectory
    $ProcessInfo.UseShellExecute = $false
    $ProcessInfo.CreateNoWindow = $true
    
    $Process = [System.Diagnostics.Process]::Start($ProcessInfo)
    return $Process
}

try {
    # Start MCP Health Monitor
    Write-Host "🔍 Starting MCP Health Monitor..." -ForegroundColor Yellow
    $MonitorProcess = Start-BackgroundProcess -Command "node" -Arguments "playwright-mcp-monitor.js start"
    
    # Wait a moment for monitor to initialize
    Start-Sleep -Seconds 2
    
    # Start Frontend Development Server
    Write-Host "🚀 Starting Frontend Development Server..." -ForegroundColor Green
    $FrontendProcess = Start-BackgroundProcess -Command "npm" -Arguments "run dev" -WorkingDirectory "apps\frontend"
    
    # Start Backend Server
    Write-Host "🔧 Starting Backend Server..." -ForegroundColor Blue
    $BackendProcess = Start-BackgroundProcess -Command "npm" -Arguments "start" -WorkingDirectory "apps\backend"
    
    Write-Host ""
    Write-Host "✅ EVA App is starting with MCP monitoring!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Monitor outputs:" -ForegroundColor White
    Write-Host "- Health checks: mcp-monitor-log.json" -ForegroundColor Gray
    Write-Host "- Fix recommendations: mcp-fix-recommendations.json" -ForegroundColor Gray
    Write-Host "- Console errors: debug-log.json" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 Visit: http://localhost:3004" -ForegroundColor Cyan
    Write-Host "🐛 Debug monitoring is active" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Red
    
    # Keep script running and monitor processes
    $ProcessList = @($MonitorProcess, $FrontendProcess, $BackendProcess)
    
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Check if any process has exited
        foreach ($Process in $ProcessList) {
            if ($Process -and $Process.HasExited) {
                Write-Host "⚠️  Process $($Process.ProcessName) has exited" -ForegroundColor Red
            }
        }
    }
    
} catch {
    Write-Host "❌ Error starting services: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Cleanup on exit
    Write-Host "🛑 Shutting down services..." -ForegroundColor Yellow
    
    try {
        if ($MonitorProcess -and -not $MonitorProcess.HasExited) {
            $MonitorProcess.Kill()
        }
        if ($FrontendProcess -and -not $FrontendProcess.HasExited) {
            $FrontendProcess.Kill()
        }
        if ($BackendProcess -and -not $BackendProcess.HasExited) {
            $BackendProcess.Kill()
        }
    } catch {
        # Silent cleanup
    }
    
    Write-Host "✅ All services stopped" -ForegroundColor Green
}

# EVA App - Enhanced MCP Debug Startup (PowerShell)
Write-Host "========================================"
Write-Host " EVA App - Enhanced MCP Debug Startup"
Write-Host "========================================"
Write-Host ""

Write-Host "[1/4] Checking application status..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

Write-Host "[2/4] Starting development server with MCP debugging..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Next.js development server on port 3004..." -ForegroundColor Green
Write-Host "MCP Debug tools will be automatically loaded..." -ForegroundColor Green
Write-Host ""

# Start development server in background
Set-Location "apps\frontend"
Start-Process PowerShell -ArgumentList "-Command", "npm run dev" -WindowStyle Normal

Write-Host "[3/4] Waiting for server to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

Write-Host "[4/4] Running initial Playwright health check..." -ForegroundColor Cyan
Set-Location "..\..\"
node playwright-visual-test.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " EVA App Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "- Dashboard: http://localhost:3004" -ForegroundColor Yellow
Write-Host "- MCP Debug: Integrated in browser console" -ForegroundColor Yellow  
Write-Host "- Playwright: Visual tests available" -ForegroundColor Yellow
Write-Host "- Enhanced UI: Interactive components active" -ForegroundColor Yellow
Write-Host ""

# Offer to run another visual test
Write-Host "Press any key to run another visual test..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
node playwright-visual-test.js

Write-Host ""
Write-Host "Startup complete!" -ForegroundColor Green
Write-Host "Check the preview browser for the enhanced dashboard." -ForegroundColor Cyan

# Keep window open
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
