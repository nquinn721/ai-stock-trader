#!/usr/bin/env pwsh
# Complete Test Suite - Runs all tests across the workspace

Write-Host "🚀 Running Complete Test Suite for Stock Trading App" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

$ErrorActionPreference = "Continue"
$testResults = @{}

function Invoke-TestSuite {
    param(
        [string]$TestName,
        [string]$Directory,
        [string]$Command
    )
    
    Write-Host "`n📝 Running $TestName..." -ForegroundColor Yellow
    
    Push-Location $Directory
    try {
        Invoke-Expression $Command | Out-Host
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $TestName PASSED" -ForegroundColor Green
            $testResults[$TestName] = "PASSED"
        } else {
            Write-Host "❌ $TestName FAILED" -ForegroundColor Red
            $testResults[$TestName] = "FAILED"
        }
    }
    catch {
        Write-Host "❌ $TestName ERROR: $_" -ForegroundColor Red
        $testResults[$TestName] = "ERROR"
    }
    finally {
        Pop-Location
    }
}

# Run Backend Tests
Invoke-TestSuite "Backend Unit Tests" "backend" "npm test -- --coverage --testTimeout=60000"
Invoke-TestSuite "Backend Integration Tests" "backend" "npm run test:e2e"

# Run Frontend Tests
Invoke-TestSuite "Frontend Unit Tests" "frontend" "npm test -- --watchAll=false --coverage --testTimeout=60000"

# Run E2E Tests
Invoke-TestSuite "End-to-End Tests" "e2e-tests" "npm test"

# Test Development Scripts
Invoke-TestSuite "Stock API Test" "." "npm run test:stocks"
Invoke-TestSuite "Signal Distribution Test" "." "npm run test:signals"
Invoke-TestSuite "Recommendation Test" "." "npm run test:recommendations"

# Build Tests
Invoke-TestSuite "Backend Build" "backend" "npm run build"
Invoke-TestSuite "Frontend Build" "frontend" "npm run build"

# Print Summary
Write-Host "`n📊 COMPLETE TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

foreach ($test in $testResults.GetEnumerator()) {
    $status = $test.Value
    $color = switch ($status) {
        "PASSED" { "Green" }
        "FAILED" { "Red" }
        "ERROR" { "Magenta" }
    }
    Write-Host "$($test.Key): $status" -ForegroundColor $color
}

$passed = ($testResults.Values | Where-Object { $_ -eq "PASSED" }).Count
$total = $testResults.Count

Write-Host "`n🎯 Final Results: $passed/$total test suites passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host "🎉 All test suites passed! Ready for production." -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some test suites failed. Review the output above." -ForegroundColor Yellow
    exit 1
}
