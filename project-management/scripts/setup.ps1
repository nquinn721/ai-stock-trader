# 🚀 Project Management Quick Setup
# Usage: .\setup.ps1

Write-Host "🚀 Setting up Project Management System..." -ForegroundColor Cyan

# Set working directory to project management
$ProjectMgmtPath = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectMgmtPath

# Create reports directory if it doesn't exist
if (!(Test-Path "reports")) {
    New-Item -Path "reports" -ItemType Directory -Force | Out-Null
    Write-Host "✅ Created reports directory" -ForegroundColor Green
}

# Make scripts executable (PowerShell doesn't need this, but good practice)
$scriptFiles = Get-ChildItem "scripts/*.ps1"
foreach ($script in $scriptFiles) {
    Write-Host "📝 Script available: $($script.Name)" -ForegroundColor Gray
}

# Test script functionality
Write-Host "`n🧪 Testing scripts..." -ForegroundColor Cyan

# Test generate-report
try {
    Write-Host "Testing generate-report.ps1..." -ForegroundColor Gray
    $reportTest = & "scripts/generate-report.ps1" -OutputFormat "console" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ generate-report.ps1 working" -ForegroundColor Green
    } else {
        Write-Host "⚠️ generate-report.ps1 needs attention" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ generate-report.ps1 error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test search-stories
try {
    Write-Host "Testing search-stories.ps1..." -ForegroundColor Gray
    $searchTest = & "scripts/search-stories.ps1" -Query "test" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ search-stories.ps1 working" -ForegroundColor Green
    } else {
        Write-Host "⚠️ search-stories.ps1 needs attention" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ search-stories.ps1 error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Project Management System Ready!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

Write-Host "`n🎯 Quick Commands:" -ForegroundColor Cyan
Write-Host "  .\scripts\generate-report.ps1           # Generate progress report" -ForegroundColor Gray
Write-Host "  .\scripts\search-stories.ps1 -Query X   # Search stories" -ForegroundColor Gray
Write-Host "  .\scripts\create-story.ps1 -Interactive # Create new story" -ForegroundColor Gray
Write-Host "  .\scripts\start-sprint.ps1 -Interactive # Start new sprint" -ForegroundColor Gray

Write-Host "`n📖 Key Files:" -ForegroundColor Cyan
Write-Host "  roadmap.md                              # Project roadmap" -ForegroundColor Gray
Write-Host "  backlog.md                              # Product backlog" -ForegroundColor Gray
Write-Host "  progress.md                             # Current progress" -ForegroundColor Gray
Write-Host "  sprints/current.md                      # Current sprint" -ForegroundColor Gray

Write-Host "`n💡 Pro Tips:" -ForegroundColor Cyan
Write-Host "  - Use Git to track all changes" -ForegroundColor Gray
Write-Host "  - Update story status regularly" -ForegroundColor Gray
Write-Host "  - Generate reports for standups" -ForegroundColor Gray
Write-Host "  - Search stories to find related work" -ForegroundColor Gray

Write-Host "`n🎉 Happy project managing!" -ForegroundColor Green
