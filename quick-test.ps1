#!/usr/bin/env pwsh
# Quick Test Script - Runs essential tests across the workspace

Write-Host "🚀 Running Quick Tests for Stock Trading App" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

$ErrorActionPreference = "Continue"
$testResults = @{}

function Run-Test {
    param(
        [string]$TestName,
        [string]$Directory,
        [string]$Command
    )
    
    Write-Host "`n📝 Running $TestName..." -ForegroundColor Yellow
    
    Push-Location $Directory
    try {
        $result = Invoke-Expression $Command
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

# Run Backend Quick Tests
Run-Test "Backend Unit Tests" "backend" "npm test -- --testTimeout=30000 --passWithNoTests"

# Run Frontend Quick Tests  
Run-Test "Frontend Component Tests" "frontend" "npm test -- --watchAll=false --testTimeout=30000"

# Test Development Scripts
Run-Test "Stock Endpoint Test" "." "npm run test:stocks"

# Print Summary
Write-Host "`n📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

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

Write-Host "`n🎯 Results: $passed/$total tests passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host "🎉 All tests passed! Ready for development." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Check the output above." -ForegroundColor Yellow
}
