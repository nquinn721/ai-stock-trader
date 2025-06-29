# Test Docker Build Script for Stock Trading App (PowerShell)
# This script tests the Docker build locally before deploying to Cloud Run

$ErrorActionPreference = "Stop"

Write-Host "🧪 Testing Docker build for Stock Trading App" -ForegroundColor Green

# Test main Dockerfile
Write-Host "📦 Testing main Dockerfile..." -ForegroundColor Yellow
docker build -f Dockerfile -t stock-trading-app:test .

# Test if the image was built successfully
$mainImage = docker images | Select-String "stock-trading-app.*test"
if ($mainImage) {
    Write-Host "✅ Main Dockerfile build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Main Dockerfile build failed" -ForegroundColor Red
    exit 1
}

# Test Cloud Run specific Dockerfile
Write-Host "📦 Testing Cloud Run Dockerfile..." -ForegroundColor Yellow
docker build -f Dockerfile.cloudrun -t stock-trading-app:cloudrun-test .

# Test if the Cloud Run image was built successfully
$cloudrunImage = docker images | Select-String "stock-trading-app.*cloudrun-test"
if ($cloudrunImage) {
    Write-Host "✅ Cloud Run Dockerfile build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Cloud Run Dockerfile build failed" -ForegroundColor Red
    exit 1
}

# Test backend-only Dockerfile
Write-Host "📦 Testing backend Dockerfile..." -ForegroundColor Yellow
Set-Location backend
docker build -f Dockerfile.prod -t stock-trading-backend:test .
Set-Location ..

# Test if the backend image was built successfully
$backendImage = docker images | Select-String "stock-trading-backend.*test"
if ($backendImage) {
    Write-Host "✅ Backend Dockerfile build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Dockerfile build failed" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 All Docker builds completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Built images:" -ForegroundColor Green
docker images | Select-String "stock-trading"
Write-Host ""
Write-Host "🧹 To clean up test images, run:" -ForegroundColor Yellow
Write-Host "docker rmi stock-trading-app:test stock-trading-app:cloudrun-test stock-trading-backend:test"
