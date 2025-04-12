# Run this script as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Please run this script as Administrator!"
    exit
}

# Kill any running node processes
taskkill /F /IM node.exe /T 2>$null

# Define paths to clean
$paths = @(
    "node_modules",
    "apps/*/node_modules",
    "packages/*/node_modules",
    "apps/*/.next",
    ".turbo"
)

# Clean directories
foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "Removing $path..."
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Clean Turbo cache
$turboCache = "$env:LOCALAPPDATA\Turbo"
if (Test-Path $turboCache) {
    Write-Host "Removing Turbo cache..."
    Remove-Item $turboCache -Recurse -Force -ErrorAction SilentlyContinue
}

# Set permissions
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$acl = Get-Acl "."
$permission = $currentUser, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($rule)
Set-Acl "." $acl

# Verify npm cache is clean
npm cache clean --force

Write-Host "Done! Now try running 'npm install' and 'npm run dev'" 