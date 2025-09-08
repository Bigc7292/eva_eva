# MCP Configuration Update Script

Write-Host "MCP Configuration Update Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Define paths
$fixedConfigPath = Join-Path $PWD "mcp-config-fixed.json"
$mcpConfigPath = Join-Path $env:APPDATA "Qoder\SharedClientCache\mcp.json"
$mcpConfigDir = Split-Path $mcpConfigPath -Parent

# Check if fixed config exists
if (-not (Test-Path $fixedConfigPath)) {
    Write-Host "Error: Fixed config file not found: $fixedConfigPath" -ForegroundColor Red
    exit 1
}

# Create directory if it doesn't exist
if (-not (Test-Path $mcpConfigDir)) {
    Write-Host "Creating MCP config directory..." -ForegroundColor Yellow
    New-Item -Path $mcpConfigDir -ItemType Directory -Force | Out-Null
}

# Backup existing config if it exists
if (Test-Path $mcpConfigPath) {
    $backupPath = $mcpConfigPath + ".backup." + (Get-Date -Format "yyyyMMdd-HHmmss")
    Write-Host "Backing up existing config to: $backupPath" -ForegroundColor Yellow
    Copy-Item $mcpConfigPath $backupPath
}

# Copy new configuration
try {
    Copy-Item $fixedConfigPath $mcpConfigPath -Force
    Write-Host "SUCCESS: MCP configuration updated!" -ForegroundColor Green
    Write-Host "Configuration saved to: $mcpConfigPath" -ForegroundColor Cyan
} catch {
    Write-Host "Error copying configuration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update API keys in the configuration file:"
Write-Host "   - Figma: Replace 'your-figma-token-here' with your Figma API token"
Write-Host "2. Restart Qoder IDE for changes to take effect"
Write-Host ""
Write-Host "Configuration update completed!" -ForegroundColor Green