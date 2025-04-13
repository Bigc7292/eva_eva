Write-Host "Fixing React version inconsistencies..."

# Navigate to the frontend directory
Set-Location -Path apps\frontend

# Remove node_modules
Write-Host "Removing node_modules..."
if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
}

# Remove package-lock.json
Write-Host "Removing package-lock.json..."
if (Test-Path package-lock.json) {
    Remove-Item -Force package-lock.json
}

# Remove .next directory
Write-Host "Removing .next directory..."
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
}

# Remove build directory
Write-Host "Removing build directory..."
if (Test-Path build) {
    Remove-Item -Recurse -Force build
}

# Install dependencies
Write-Host "Installing dependencies..."
npm install

# Return to the root directory
Set-Location -Path ..\..\

Write-Host "Done! Now try running 'npm run dev' in the frontend directory."
