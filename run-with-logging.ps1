Write-Host "Starting application with detailed logging..."

# Set environment variables for detailed logging
$env:DEBUG = "*"
$env:NODE_OPTIONS = "--trace-warnings"

# Navigate to the frontend directory
Set-Location -Path apps\frontend

# Clean the cache directory manually
Write-Host "Cleaning Next.js cache..."
if (Test-Path ".next\cache") {
    Remove-Item -Recurse -Force ".next\cache"
}

# Run the development server
Write-Host "Running Next.js with detailed logging..."
npm run dev

# Return to the root directory
Set-Location -Path ..\..\
