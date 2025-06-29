# Docker Image Testing Script for Windows
# Tests different Docker base images for the Stock Trading App

Write-Host "🐳 Docker Image Testing Script" -ForegroundColor Blue
Write-Host "Testing different base images for optimal performance"
Write-Host ""

# Function to test Docker build
function Test-DockerBuild {
    param(
        [string]$Dockerfile,
        [string]$Tag,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "Dockerfile: $Dockerfile"
    Write-Host "Tag: $Tag"
    
    $startTime = Get-Date
    
    try {
        docker build -f $Dockerfile -t $Tag .
        $endTime = Get-Date
        $buildTime = ($endTime - $startTime).TotalSeconds
        $imageSize = docker images $Tag --format "{{.Size}}"
        
        Write-Host "✅ Build successful" -ForegroundColor Green
        Write-Host "Build time: $([math]::Round($buildTime, 2))s"
        Write-Host "Image size: $imageSize"
        Write-Host ""
        
        return $true
    }
    catch {
        Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Function to test container run
function Test-ContainerRun {
    param(
        [string]$Tag,
        [int]$Port
    )
    
    Write-Host "Testing container runtime: $Tag" -ForegroundColor Yellow
    
    try {
        # Run container in background
        docker run -d --name "test-$Tag" -p "$Port:8000" $Tag | Out-Null
        Start-Sleep 10
        
        # Test health endpoint
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Container running and healthy" -ForegroundColor Green
            docker stop "test-$Tag" | Out-Null
            docker rm "test-$Tag" | Out-Null
            return $true
        }
        else {
            Write-Host "❌ Container not responding to health check" -ForegroundColor Red
            docker logs "test-$Tag"
            docker stop "test-$Tag" | Out-Null
            docker rm "test-$Tag" | Out-Null
            return $false
        }
    }
    catch {
        Write-Host "❌ Container failed: $($_.Exception.Message)" -ForegroundColor Red
        docker stop "test-$Tag" 2>$null | Out-Null
        docker rm "test-$Tag" 2>$null | Out-Null
        return $false
    }
}

# Clean up previous test images
Write-Host "🧹 Cleaning up previous test images..." -ForegroundColor Yellow
@("stock-app-alpine", "stock-app-slim", "stock-app-ubuntu", "stock-app-tf", "stock-app-distroless") | ForEach-Object {
    docker rmi $_ 2>$null | Out-Null
}
Write-Host ""

# Test current Alpine-based Dockerfile
Write-Host "=== Testing Current Alpine Implementation ===" -ForegroundColor Blue
Test-DockerBuild "backend/Dockerfile.prod" "stock-app-alpine" "Current Alpine-based"

# Test Node.js Slim
Write-Host "=== Testing Node.js Slim Implementation ===" -ForegroundColor Blue
Test-DockerBuild "backend/Dockerfile.node-slim" "stock-app-slim" "Node.js Slim (Recommended)"

# Test Ubuntu
Write-Host "=== Testing Ubuntu Implementation ===" -ForegroundColor Blue
Test-DockerBuild "backend/Dockerfile.ubuntu" "stock-app-ubuntu" "Ubuntu 22.04 (Maximum Compatibility)"

# Test TensorFlow optimized
Write-Host "=== Testing TensorFlow Optimized Implementation ===" -ForegroundColor Blue
Test-DockerBuild "backend/Dockerfile.tensorflow" "stock-app-tf" "TensorFlow Optimized"

# Test Distroless
Write-Host "=== Testing Distroless Implementation ===" -ForegroundColor Blue
Test-DockerBuild "backend/Dockerfile.distroless" "stock-app-distroless" "Google Distroless (Security Focused)"

# Summary
Write-Host "=== Build Summary ===" -ForegroundColor Blue
Write-Host "All builds completed. Image sizes:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | Where-Object { $_ -match "stock-app" }
Write-Host ""

# Test runtime (optional)
$testRuntime = Read-Host "Test container runtime? (y/N)"
if ($testRuntime -eq "y" -or $testRuntime -eq "Y") {
    Write-Host "=== Runtime Testing ===" -ForegroundColor Blue
    
    # Only test the ones that built successfully
    $images = @("stock-app-alpine", "stock-app-slim", "stock-app-ubuntu", "stock-app-tf", "stock-app-distroless")
    $port = 8001
    
    foreach ($image in $images) {
        $exists = docker images -q $image
        if ($exists) {
            Test-ContainerRun $image $port
            $port++
            Write-Host ""
        }
    }
}

Write-Host "🎉 Testing completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Yellow
Write-Host "1. Node.js Slim: Best balance of size, compatibility, and performance"
Write-Host "2. Ubuntu: Use if you encounter native module issues"
Write-Host "3. Distroless: Use for maximum security in production"
Write-Host "4. TensorFlow: Use for heavy ML workloads"
Write-Host ""
Write-Host "Update your main Dockerfile with the best performing option."
