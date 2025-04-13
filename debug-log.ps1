Write-Host "Starting detailed logging..."

# Create a log file
$logFile = "app-debug-log.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] Starting debug logging" | Out-File -FilePath $logFile

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    "[$timestamp] Node.js version: $nodeVersion" | Out-File -FilePath $logFile -Append
} catch {
    "[$timestamp] ERROR: Node.js not found" | Out-File -FilePath $logFile -Append
    Write-Host "ERROR: Node.js not found" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm -v
    "[$timestamp] npm version: $npmVersion" | Out-File -FilePath $logFile -Append
} catch {
    "[$timestamp] ERROR: npm not found" | Out-File -FilePath $logFile -Append
    Write-Host "ERROR: npm not found" -ForegroundColor Red
    exit 1
}

# Navigate to the frontend directory
Set-Location -Path apps\frontend
"[$timestamp] Changed directory to apps\frontend" | Out-File -FilePath ..\..\$logFile -Append

# Check package.json
if (Test-Path package.json) {
    "[$timestamp] package.json found" | Out-File -FilePath ..\..\$logFile -Append
    $packageJson = Get-Content package.json -Raw | ConvertFrom-Json
    "[$timestamp] Project name: $($packageJson.name)" | Out-File -FilePath ..\..\$logFile -Append
    "[$timestamp] Next.js version: $($packageJson.dependencies.next)" | Out-File -FilePath ..\..\$logFile -Append
    "[$timestamp] React version: $($packageJson.dependencies.react)" | Out-File -FilePath ..\..\$logFile -Append
} else {
    "[$timestamp] ERROR: package.json not found" | Out-File -FilePath ..\..\$logFile -Append
    Write-Host "ERROR: package.json not found" -ForegroundColor Red
    Set-Location -Path ..\..\
    exit 1
}

# Check for node_modules
if (Test-Path node_modules) {
    "[$timestamp] node_modules found" | Out-File -FilePath ..\..\$logFile -Append
} else {
    "[$timestamp] WARNING: node_modules not found, running npm install" | Out-File -FilePath ..\..\$logFile -Append
    Write-Host "WARNING: node_modules not found, running npm install" -ForegroundColor Yellow
    npm install 2>&1 | Tee-Object -FilePath ..\..\$logFile -Append
}

# Check for .next directory
if (Test-Path .next) {
    "[$timestamp] .next directory found" | Out-File -FilePath ..\..\$logFile -Append
} else {
    "[$timestamp] .next directory not found" | Out-File -FilePath ..\..\$logFile -Append
}

# Check for environment variables
if (Test-Path .env.local) {
    "[$timestamp] .env.local found" | Out-File -FilePath ..\..\$logFile -Append
    $envVars = Get-Content .env.local
    foreach ($line in $envVars) {
        if ($line -match "^[^#]") {
            $varName = $line.Split('=')[0]
            "[$timestamp] Environment variable found: $varName" | Out-File -FilePath ..\..\$logFile -Append
        }
    }
} else {
    "[$timestamp] WARNING: .env.local not found" | Out-File -FilePath ..\..\$logFile -Append
    Write-Host "WARNING: .env.local not found" -ForegroundColor Yellow
}

# Check for app directory
if (Test-Path src\app) {
    "[$timestamp] src\app directory found" | Out-File -FilePath ..\..\$logFile -Append
    $appFiles = Get-ChildItem -Path src\app -Recurse -File | Where-Object { $_.Extension -match "\.(js|jsx|ts|tsx)$" }
    "[$timestamp] Found $($appFiles.Count) app files" | Out-File -FilePath ..\..\$logFile -Append
} else {
    "[$timestamp] ERROR: src\app directory not found" | Out-File -FilePath ..\..\$logFile -Append
    Write-Host "ERROR: src\app directory not found" -ForegroundColor Red
}

# Run the development server with detailed logging
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] Starting Next.js development server" | Out-File -FilePath ..\..\$logFile -Append
Write-Host "Starting Next.js development server..." -ForegroundColor Green

# Set environment variables for detailed logging
$env:DEBUG = "*"
$env:NODE_OPTIONS = "--trace-warnings"

# Run the development server and capture output
npm run dev 2>&1 | Tee-Object -FilePath ..\..\$logFile -Append

# Return to the root directory
Set-Location -Path ..\..\
