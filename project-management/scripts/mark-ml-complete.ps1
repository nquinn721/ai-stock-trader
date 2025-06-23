# Simple Script to Mark ML Stories Complete
param(
    [string]$StoryId = "ALL"
)

Write-Host "🚀 Marking ML Infrastructure Stories as COMPLETED" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$statusFile = Join-Path $projectRoot "project-management\project-status.json"

try {
    # Read and update project status
    $projectStatus = Get-Content $statusFile -Raw | ConvertFrom-Json
    
    # Update ML stories
    $mlStories = @("S27", "S28", "S29")
    $completedDate = Get-Date -Format "yyyy-MM-dd"
    
    foreach ($story in $mlStories) {
        if ($projectStatus.stories.PSObject.Properties.Name -contains $story) {
            $projectStatus.stories.$story.status = "COMPLETED"
            $projectStatus.stories.$story.completedDate = $completedDate
            $projectStatus.stories.$story.acceptanceCriteria.completed = $projectStatus.stories.$story.acceptanceCriteria.total
            $projectStatus.stories.$story.acceptanceCriteria.completionRate = 100
            Write-Host "✅ Updated $story to COMPLETED" -ForegroundColor Green
        }
    }
    
    # Update project metrics
    $projectStatus.sprints.current.status = "COMPLETED"
    $projectStatus.sprints.current.completed = 58
    $projectStatus.sprints.current.completionRate = 100
    $projectStatus.phases."Phase 3 (ML Infrastructure)".status = "COMPLETED"
    $projectStatus.phases."Phase 3 (ML Infrastructure)".completionRate = 100
    $projectStatus.project.lastUpdated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    
    # Save updated status
    $projectStatus | ConvertTo-Json -Depth 10 | Out-File $statusFile -Encoding UTF8
    
    Write-Host "`n🎉 Successfully updated ML Infrastructure stories!" -ForegroundColor Green
    Write-Host "✅ S27 - Phase 1 Foundation: COMPLETED" -ForegroundColor Green
    Write-Host "✅ S28 - Phase 2 Intelligence: COMPLETED" -ForegroundColor Green
    Write-Host "✅ S29 - Phase 3 Advanced Systems: COMPLETED" -ForegroundColor Green
    Write-Host "🎯 Sprint 5: COMPLETED (100%)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
