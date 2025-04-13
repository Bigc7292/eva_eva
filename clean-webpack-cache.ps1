Write-Host "Cleaning Webpack cache..."

# Navigate to the frontend directory
Set-Location -Path apps\frontend

# Remove .next/cache directory
Write-Host "Removing .next/cache directory..."
if (Test-Path .next\cache) {
    Remove-Item -Recurse -Force .next\cache
}

# Remove build/cache directory
Write-Host "Removing build/cache directory..."
if (Test-Path build\cache) {
    Remove-Item -Recurse -Force build\cache
}

# Return to the root directory
Set-Location -Path ..\..\

Write-Host "Done! Now try running 'npm run dev:clean' in the frontend directory."
