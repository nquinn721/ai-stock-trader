# Cloud Run Deployment Script for Stock Trading App - PowerShell Version
# This script builds and deploys the application to Google Cloud Run

param(
    [string]$ProjectId = $env:GOOGLE_CLOUD_PROJECT,
    [string]$Region = $env:GOOGLE_CLOUD_REGION
)

# Set default values
if (-not $Region) { $Region = "us-central1" }

$ServiceName = "stock-trading-app"
$ImageName = "gcr.io/$ProjectId/$ServiceName"

Write-Host "🚀 Starting Cloud Run deployment for Stock Trading App" -ForegroundColor Green

# Check if gcloud is installed
try {
    gcloud version | Out-Null
} catch {
    Write-Host "❌ gcloud CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install gcloud CLI or add it to your PATH" -ForegroundColor Yellow
    exit 1
}

# Check if PROJECT_ID is set
if (-not $ProjectId) {
    Write-Host "⚠️  GOOGLE_CLOUD_PROJECT is not set. Please set it:" -ForegroundColor Yellow
    Write-Host "`$env:GOOGLE_CLOUD_PROJECT = 'your-project-id'"
    Write-Host "Or run: gcloud config set project your-project-id"
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "  Project ID: $ProjectId"
Write-Host "  Region: $Region"
Write-Host "  Service Name: $ServiceName"
Write-Host "  Image: $ImageName"
Write-Host ""

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Green
gcloud services enable cloudbuild.googleapis.com --project=$ProjectId
gcloud services enable run.googleapis.com --project=$ProjectId
gcloud services enable containerregistry.googleapis.com --project=$ProjectId

# Build and submit using Cloud Build
Write-Host "🔨 Building application with Cloud Build..." -ForegroundColor Green

try {
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""

# Get service URL
Write-Host "🌐 Service URL:" -ForegroundColor Green
try {
    $serviceUrl = gcloud run services describe $ServiceName --region=$Region --format="value(status.url)" --project=$ProjectId 2>$null
    if ($serviceUrl) {
        Write-Host $serviceUrl
    } else {
        Write-Host "Service URL not available yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not retrieve service URL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Green
try {
    gcloud run services describe $ServiceName --region=$Region --format="table(metadata.name,status.url,status.conditions.type,status.conditions.status)" --project=$ProjectId
} catch {
    Write-Host "Could not retrieve service status" -ForegroundColor Yellow
}
