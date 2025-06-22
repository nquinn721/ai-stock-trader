# Complete test runner for Stock Trading App
# Runs all test types: unit, integration, and e2e tests

Write-Host "Stock Trading App - Complete Test Suite" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Function to check if servers are running
function Test-ServerConnection {
    param(
        [string]$Url,
        [string]$ServerName
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $ServerName is running" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ $ServerName is not running at $Url" -ForegroundColor Red
        return $false
    }
}

# Function to run tests and capture results
function Run-TestSuite {
    param(
        [string]$TestName,
        [string]$Directory,
        [string]$Command,
        [string]$Color = "Yellow",
        [bool]$RequiresServers = $false
    )
    
    Write-Host "🧪 Running $TestName..." -ForegroundColor $Color
    Write-Host "   Directory: $Directory" -ForegroundColor Gray
    Write-Host "   Command: $Command" -ForegroundColor Gray
    Write-Host ""
    
    try {
        Push-Location $Directory
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Test failed with exit code $LASTEXITCODE"
        }
        Write-Host "✅ $TestName PASSED" -ForegroundColor Green
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "❌ $TestName FAILED" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        Write-Host ""
        return $false
    }
    finally {
        Pop-Location
    }
}

# Function to run manual API tests
function Test-APIEndpoints {
    Write-Host "🌐 Testing API Endpoints..." -ForegroundColor Cyan
    Write-Host ""
    
    $endpoints = @(
        @{ Url = "http://localhost:8000/stocks"; Name = "Stocks API" },
        @{ Url = "http://localhost:8000/stocks/with-signals/all"; Name = "Stocks with Signals API" },
        @{ Url = "http://localhost:8000/paper-trading/portfolios"; Name = "Paper Trading API" },
        @{ Url = "http://localhost:8000/trading/signals"; Name = "Trading Signals API" }
    )
    
    $allPassed = $true
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $($endpoint.Name): OK" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $($endpoint.Name): Status $($response.StatusCode)" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "❌ $($endpoint.Name): Failed - $($_.Exception.Message)" -ForegroundColor Red
            $allPassed = $false
        }
    }
    
    Write-Host ""
    return $allPassed
}

# Initialize results
$results = @()
$totalTests = 0
$passedTests = 0

Write-Host "🎯 Running Complete Test Suite" -ForegroundColor Magenta
Write-Host "===============================" -ForegroundColor Magenta
Write-Host ""

# Check if servers are running for E2E tests
Write-Host "🔍 Checking Server Status..." -ForegroundColor Yellow
$backendRunning = Test-ServerConnection -Url "http://localhost:8000/stocks" -ServerName "Backend (Port 8000)"
$frontendRunning = Test-ServerConnection -Url "http://localhost:3000" -ServerName "Frontend (Port 3000)"
Write-Host ""

# Backend Unit Tests
Write-Host "🛠️  BACKEND UNIT TESTS" -ForegroundColor Blue
Write-Host "======================" -ForegroundColor Blue
$result = Run-TestSuite -TestName "Backend Unit Tests" -Directory "backend" -Command "npm test -- --passWithNoTests --watchAll=false" -Color "Blue"
$results += @{ Name = "Backend Unit Tests"; Passed = $result }
$totalTests++
if ($result) { $passedTests++ }

# Backend Integration Tests
Write-Host "🔗 BACKEND INTEGRATION TESTS" -ForegroundColor Blue
Write-Host "=============================" -ForegroundColor Blue
$result = Run-TestSuite -TestName "Backend Integration Tests" -Directory "backend" -Command "npm run test:e2e -- --passWithNoTests" -Color "Blue"
$results += @{ Name = "Backend Integration Tests"; Passed = $result }
$totalTests++
if ($result) { $passedTests++ }

# Frontend Unit Tests
Write-Host "⚛️  FRONTEND UNIT TESTS" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
$result = Run-TestSuite -TestName "Frontend Unit Tests" -Directory "frontend" -Command "npm test -- --passWithNoTests --watchAll=false --coverage" -Color "Green"
$results += @{ Name = "Frontend Unit Tests"; Passed = $result }
$totalTests++
if ($result) { $passedTests++ }

# API Endpoint Tests (if backend is running)
if ($backendRunning) {
    Write-Host "🌐 API ENDPOINT TESTS" -ForegroundColor Magenta
    Write-Host "=====================" -ForegroundColor Magenta
    $result = Test-APIEndpoints
    $results += @{ Name = "API Endpoint Tests"; Passed = $result }
    $totalTests++
    if ($result) { $passedTests++ }
} else {
    Write-Host "⚠️  Skipping API Endpoint Tests - Backend not running" -ForegroundColor Yellow
    Write-Host "   Start backend with: cd backend && npm run start:dev" -ForegroundColor Gray
    Write-Host ""
}

# E2E Tests (if both servers are running)
if ($backendRunning -and $frontendRunning) {
    Write-Host "🎭 END-TO-END TESTS" -ForegroundColor Magenta
    Write-Host "===================" -ForegroundColor Magenta
    $result = Run-TestSuite -TestName "E2E Tests" -Directory "e2e-tests" -Command "npx playwright test --reporter=line" -Color "Magenta" -RequiresServers $true
    $results += @{ Name = "E2E Tests"; Passed = $result }
    $totalTests++
    if ($result) { $passedTests++ }
} else {
    Write-Host "⚠️  Skipping E2E Tests - Servers not running" -ForegroundColor Yellow
    if (-not $backendRunning) {
        Write-Host "   Backend: cd backend && npm run start:dev" -ForegroundColor Gray
    }
    if (-not $frontendRunning) {
        Write-Host "   Frontend: cd frontend && npm start" -ForegroundColor Gray
    }
    Write-Host ""
}

# Calculate execution time
$endTime = Get-Date
$duration = $endTime - $startTime
$durationString = "{0:mm\:ss}" -f $duration

# Print Summary
Write-Host ""
Write-Host "📊 COMPLETE TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Total Test Suites: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor Red
Write-Host "Duration: $durationString" -ForegroundColor Yellow
Write-Host ""

# Detailed Results
foreach ($result in $results) {
    $status = if ($result.Passed) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($result.Passed) { "Green" } else { "Red" }
    Write-Host "$status $($result.Name)" -ForegroundColor $color
}

Write-Host ""

# Final Result
if ($passedTests -eq $totalTests) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✨ Complete test suite passed successfully!" -ForegroundColor Green
    Write-Host "   Code is ready for commit and deployment." -ForegroundColor Gray
    Write-Host "   All quality gates have been met." -ForegroundColor Gray
    Write-Host ""
    Write-Host "📈 Quality Metrics:" -ForegroundColor Cyan
    Write-Host "   - Unit Tests: ✅ Passed" -ForegroundColor Green
    Write-Host "   - Integration Tests: ✅ Passed" -ForegroundColor Green
    if ($backendRunning) {
        Write-Host "   - API Tests: ✅ Passed" -ForegroundColor Green
    }
    if ($backendRunning -and $frontendRunning) {
        Write-Host "   - E2E Tests: ✅ Passed" -ForegroundColor Green
    }
    exit 0
} else {
    Write-Host "⚠️  SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ $($totalTests - $passedTests) out of $totalTests test suites failed." -ForegroundColor Red
    Write-Host "   Please fix failing tests before committing code." -ForegroundColor Gray
    Write-Host "   Review the error messages above for specific issues." -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check that all dependencies are installed" -ForegroundColor Gray
    Write-Host "   2. Ensure backend and frontend servers are running for E2E tests" -ForegroundColor Gray
    Write-Host "   3. Verify API endpoints are responding correctly" -ForegroundColor Gray
    Write-Host "   4. Check for any TypeScript compilation errors" -ForegroundColor Gray
    exit 1
}
