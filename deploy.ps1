# EVA Cloud Deployment Script for Windows PowerShell
# This script deploys the EVA calling center to Google Cloud Platform

param(
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ServiceName = "eva-calling-center"
)

Write-Host "🚀 EVA Cloud Deployment Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ gcloud CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Get project ID if not provided
if ([string]::IsNullOrEmpty($ProjectId)) {
    $ProjectId = gcloud config get-value project
    if ([string]::IsNullOrEmpty($ProjectId)) {
        Write-Host "❌ No Google Cloud project is configured." -ForegroundColor Red
        Write-Host "Please run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📋 Project ID: $ProjectId" -ForegroundColor Green

# Ask for region if not provided
if ($Region -eq "us-central1") {
    $RegionInput = Read-Host "Enter your preferred region (default: us-central1)"
    if (![string]::IsNullOrEmpty($RegionInput)) {
        $Region = $RegionInput
    }
}

# Ask for service name if not provided
if ($ServiceName -eq "eva-calling-center") {
    $ServiceInput = Read-Host "Enter service name (default: eva-calling-center)"
    if (![string]::IsNullOrEmpty($ServiceInput)) {
        $ServiceName = $ServiceInput
    }
}

Write-Host "🔧 Configuration:" -ForegroundColor Yellow
Write-Host "  Project: $ProjectId"
Write-Host "  Region: $Region"
Write-Host "  Service: $ServiceName"
Write-Host ""

$Confirm = Read-Host "Continue with deployment? (y/N)"
if ($Confirm -ne 'y' -and $Confirm -ne 'Y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "🏗️  Building and deploying..." -ForegroundColor Yellow

try {
    # Enable required APIs
    Write-Host "Enabling required APIs..." -ForegroundColor Cyan
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com

    # Build and deploy using Cloud Build
    Write-Host "Starting Cloud Build..." -ForegroundColor Cyan
    gcloud builds submit --config cloudbuild.yaml --substitutions="_REGION=$Region,_SERVICE_NAME=$ServiceName"

    Write-Host "✅ Deployment completed!" -ForegroundColor Green

    # Get the service URL
    $ServiceUrl = gcloud run services describe $ServiceName --region=$Region --format="value(status.url)"

    Write-Host "🌐 Your service is available at: $ServiceUrl" -ForegroundColor Green
    Write-Host "📝 Don't forget to:" -ForegroundColor Yellow
    Write-Host "  1. Set your environment variables in Cloud Run console"
    Write-Host "  2. Update your Supabase and VAPI webhook URLs"
    Write-Host "  3. Test the health endpoint: $ServiceUrl/api/health"

    # Optionally open the service URL
    $OpenUrl = Read-Host "Open the service URL in your browser? (y/N)"
    if ($OpenUrl -eq 'y' -or $OpenUrl -eq 'Y') {
        Start-Process $ServiceUrl
    }

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}