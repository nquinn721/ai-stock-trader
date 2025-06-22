# Quick test runner for Stock Trading App
# Runs unit tests only for fast feedback during development

Write-Host "Stock Trading App - Quick Test Suite" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# Function to run tests and capture results
function Run-TestSuite {
    param(
        [string]$TestName,
        [string]$Directory,
        [string]$Command,
        [string]$Color = "Yellow"
    )
    
    Write-Host "Running $TestName..." -ForegroundColor $Color
    Write-Host "Directory: $Directory" -ForegroundColor Gray
    Write-Host "Command: $Command" -ForegroundColor Gray
    Write-Host ""
    
    try {
        Push-Location $Directory
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Test failed with exit code $LASTEXITCODE"
        }
        Write-Host "$TestName PASSED" -ForegroundColor Green
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "$TestName FAILED" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host ""
        return $false
    }
    finally {
        Pop-Location
    }
}

# Initialize results
$results = @()
$totalTests = 0
$passedTests = 0

Write-Host "Running Unit Tests Only (Quick Mode)" -ForegroundColor Magenta
Write-Host "------------------------------------" -ForegroundColor Magenta
Write-Host ""

# Backend Unit Tests
Write-Host "BACKEND UNIT TESTS" -ForegroundColor Blue
Write-Host "==================" -ForegroundColor Blue
$result = Run-TestSuite -TestName "Backend Unit Tests" -Directory "backend" -Command "npm test -- --passWithNoTests --watchAll=false --coverage=false" -Color "Blue"
$results += @{ Name = "Backend Unit Tests"; Passed = $result }
$totalTests++
if ($result) { $passedTests++ }

# Frontend Unit Tests
Write-Host "FRONTEND UNIT TESTS" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
$result = Run-TestSuite -TestName "Frontend Unit Tests" -Directory "frontend" -Command "npm test -- --passWithNoTests --watchAll=false --coverage=false" -Color "Green"
$results += @{ Name = "Frontend Unit Tests"; Passed = $result }
$totalTests++
if ($result) { $passedTests++ }

# Calculate execution time
$endTime = Get-Date
$duration = $endTime - $startTime
$durationString = "{0:mm\:ss}" -f $duration

# Print Summary
Write-Host ""
Write-Host "QUICK TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor Red
Write-Host "Duration: $durationString" -ForegroundColor Yellow
Write-Host ""

# Detailed Results
foreach ($result in $results) {
    $status = if ($result.Passed) { "PASS" } else { "FAIL" }
    $color = if ($result.Passed) { "Green" } else { "Red" }
    Write-Host "$status $($result.Name)" -ForegroundColor $color
}

Write-Host ""

# Final Result
if ($passedTests -eq $totalTests) {
    Write-Host "ALL QUICK TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Quick tests completed successfully!" -ForegroundColor Green
    Write-Host "Ready for development iteration." -ForegroundColor Gray
    Write-Host "Run .\run-all-tests.ps1 for full test suite before committing." -ForegroundColor Gray
    exit 0
} else {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed: $($totalTests - $passedTests) out of $totalTests test suites." -ForegroundColor Red
    Write-Host "Please fix failing tests before continuing development." -ForegroundColor Gray
    Write-Host "Check the error messages above for details." -ForegroundColor Gray
    exit 1
}
