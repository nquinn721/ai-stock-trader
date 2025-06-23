# Update Project Status Script
# This script updates the project-status.json file when stories are marked complete

param(
    [Parameter(Mandatory=$true)]
    [string]$StoryId,
    
    [Parameter(Mandatory=$false)]
    [string]$Status = "COMPLETED",
    
    [Parameter(Mandatory=$false)]
    [string]$CompletedBy = "AI Assistant",
    
    [Parameter(Mandatory=$false)]
    [string]$CompletedDate = (Get-Date -Format "yyyy-MM-dd")
)

$ErrorActionPreference = "Stop"

# Get the project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot
$statusFile = Join-Path $projectRoot "project-management\project-status.json"

Write-Host "🔄 Updating project status for story: $StoryId" -ForegroundColor Cyan

try {
    # Read current status
    if (Test-Path $statusFile) {
        $projectStatus = Get-Content $statusFile -Raw | ConvertFrom-Json
        Write-Host "✅ Loaded existing project status" -ForegroundColor Green
    } else {
        Write-Host "❌ Project status file not found: $statusFile" -ForegroundColor Red
        exit 1
    }
    
    # Update story status
    if ($projectStatus.stories.PSObject.Properties.Name -contains $StoryId) {
        $projectStatus.stories.$StoryId.status = $Status
        $projectStatus.stories.$StoryId.completedDate = $CompletedDate
        $projectStatus.stories.$StoryId.completedBy = $CompletedBy
        
        # Update acceptance criteria completion if marking as complete
        if ($Status -eq "COMPLETED") {
            $projectStatus.stories.$StoryId.acceptanceCriteria.completed = $projectStatus.stories.$StoryId.acceptanceCriteria.total
            $projectStatus.stories.$StoryId.acceptanceCriteria.completionRate = 100
        }
        
        Write-Host "✅ Updated story $StoryId status to: $Status" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Story $StoryId not found in project status" -ForegroundColor Yellow
        
        # Add new story if it doesn't exist
        $newStory = @{
            id = $StoryId
            title = "Story $StoryId"
            status = $Status
            completedDate = $CompletedDate
            completedBy = $CompletedBy
            acceptanceCriteria = @{
                total = 1
                completed = if ($Status -eq "COMPLETED") { 1 } else { 0 }
                completionRate = if ($Status -eq "COMPLETED") { 100 } else { 0 }
            }
        }
        
        $projectStatus.stories | Add-Member -MemberType NoteProperty -Name $StoryId -Value $newStory
        Write-Host "✅ Added new story: $StoryId" -ForegroundColor Green
    }
    
    # Update project metrics
    $allStories = $projectStatus.stories.PSObject.Properties
    $completedStories = ($allStories | Where-Object { $_.Value.status -eq "COMPLETED" }).Count
    $totalStories = $allStories.Count
    
    $projectStatus.metrics.completedStories = $completedStories
    $projectStatus.metrics.totalStories = $totalStories
    $projectStatus.metrics.overallCompletion = [math]::Round(($completedStories / $totalStories) * 100, 1)
    
    # Update last updated timestamp
    $projectStatus.project.lastUpdated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    
    # Update current sprint completion if all ML stories are done
    $mlStories = @("S27", "S28", "S29")
    $completedMlStories = $mlStories | Where-Object { 
        $projectStatus.stories.PSObject.Properties.Name -contains $_ -and 
        $projectStatus.stories.$_.status -eq "COMPLETED" 
    }
    
    if ($completedMlStories.Count -eq $mlStories.Count) {
        $projectStatus.sprints.current.status = "COMPLETED"
        $projectStatus.sprints.current.completed = $projectStatus.sprints.current.committed
        $projectStatus.sprints.current.completionRate = 100
        $projectStatus.phases."Phase 3 (ML Infrastructure)".status = "COMPLETED"
        $projectStatus.phases."Phase 3 (ML Infrastructure)".completionRate = 100
        Write-Host "🎉 Sprint 5 (ML Infrastructure) marked as COMPLETED!" -ForegroundColor Green
    }
    
    # Save updated status
    $projectStatus | ConvertTo-Json -Depth 10 | Out-File $statusFile -Encoding UTF8
    Write-Host "✅ Project status updated successfully" -ForegroundColor Green
    
    # Display summary
    Write-Host "`n📊 Project Status Summary:" -ForegroundColor Cyan
    Write-Host "  Overall Completion: $($projectStatus.metrics.overallCompletion)%" -ForegroundColor Yellow
    Write-Host "  Completed Stories: $($projectStatus.metrics.completedStories)/$($projectStatus.metrics.totalStories)" -ForegroundColor Yellow
    Write-Host "  Current Sprint: $($projectStatus.sprints.current.name) ($($projectStatus.sprints.current.status))" -ForegroundColor Yellow
    Write-Host "  ML Infrastructure: $($projectStatus.mlInfrastructure.completionRate)% complete" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error updating project status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Story $StoryId successfully updated to $Status status!" -ForegroundColor Green
