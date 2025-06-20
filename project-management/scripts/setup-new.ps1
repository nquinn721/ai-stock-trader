# 🛠️ Project Management Setup Script
# Usage: .\setup.ps1

Write-Host "🛠️ Setting up Project Management System..." -ForegroundColor Cyan

# Set working directory to project management
$ProjectMgmtPath = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectMgmtPath

Write-Host "📁 Verifying directory structure..." -ForegroundColor Yellow

# Ensure all directories exist
$directories = @(
    "epics",
    "stories", 
    "sprints",
    "scripts",
    "reports"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host "   Created: $dir/" -ForegroundColor Green
    } else {
        Write-Host "   Exists: $dir/" -ForegroundColor Gray
    }
}

Write-Host "`n📊 Testing report generation..." -ForegroundColor Yellow
try {
    & "scripts/generate-report.ps1" -OutputFormat console
    Write-Host "✅ Report generation works!" -ForegroundColor Green
} catch {
    Write-Host "❌ Report generation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 Testing story search..." -ForegroundColor Yellow
try {
    & "scripts/search-stories.ps1" -Query "test"
    Write-Host "✅ Story search works!" -ForegroundColor Green
} catch {
    Write-Host "❌ Story search failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Available Commands:" -ForegroundColor Cyan
Write-Host "   .\scripts\generate-report.ps1           - Generate progress report" -ForegroundColor White
Write-Host "   .\scripts\create-story.ps1              - Create new story" -ForegroundColor White
Write-Host "   .\scripts\search-stories.ps1            - Search existing stories" -ForegroundColor White
Write-Host "   .\scripts\start-sprint-new.ps1          - Start new sprint" -ForegroundColor White

Write-Host "`n📚 Documentation Files:" -ForegroundColor Cyan
Write-Host "   roadmap.md                              - Project roadmap" -ForegroundColor White
Write-Host "   backlog.md                              - Product backlog" -ForegroundColor White
Write-Host "   progress.md                             - Current progress" -ForegroundColor White
Write-Host "   sprints/current.md                      - Current sprint" -ForegroundColor White

Write-Host "`n🎯 Quick Start Examples:" -ForegroundColor Cyan
Write-Host '   .\scripts\create-story.ps1 -Title "New Feature" -Epic "002-ml-trading-enhancement" -Priority "high"' -ForegroundColor Gray
Write-Host '   .\scripts\search-stories.ps1 -Status "IN_PROGRESS"' -ForegroundColor Gray
Write-Host '   .\scripts\generate-report.ps1 -OutputFormat markdown -OutputFile "reports/weekly-report.md"' -ForegroundColor Gray

Write-Host "`n✅ Project Management System is ready!" -ForegroundColor Green
Write-Host "💡 Tip: Use -Interactive flag with scripts for guided prompts" -ForegroundColor Yellow
