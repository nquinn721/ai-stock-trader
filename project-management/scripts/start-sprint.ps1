# 🚀 Start New Sprint Script
# Usage: .\start-sprint.ps1 -SprintNumber 4 -StartDate "2025-01-28" -Duration 14

param(
    [Parameter(Mandatory=$true)]
    [int]$SprintNumber,
    
    [string]$StartDate = "",
    [int]$Duration = 14,
    [string]$Goal = "",
    [int]$Capacity = 40,
    [switch]$Interactive = $false
)

# Set working directory to project management
$ProjectMgmtPath = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectMgmtPath

# Interactive mode
if ($Interactive) {
    $SprintNumber = Read-Host "Sprint Number"
    $StartDate = Read-Host "Start Date (YYYY-MM-DD) [today]"
    if ([string]::IsNullOrWhiteSpace($StartDate)) { 
        $StartDate = Get-Date -Format "yyyy-MM-dd"
    }
    
    $durationInput = Read-Host "Duration in days [14]"
    if ([string]::IsNullOrWhiteSpace($durationInput)) { $Duration = 14 }
    else { $Duration = [int]$durationInput }
    
    $capacityInput = Read-Host "Team Capacity (story points) [40]"
    if ([string]::IsNullOrWhiteSpace($capacityInput)) { $Capacity = 40 }
    else { $Capacity = [int]$capacityInput }
    
    $Goal = Read-Host "Sprint Goal"
}

# Parse start date
if ([string]::IsNullOrWhiteSpace($StartDate)) {
    $startDateParsed = Get-Date
} else {
    try {
        $startDateParsed = [DateTime]::ParseExact($StartDate, "yyyy-MM-dd", $null)
    } catch {
        Write-Error "Invalid date format. Use YYYY-MM-DD format."
        exit 1
    }
}

# Calculate end date
$endDateParsed = $startDateParsed.AddDays($Duration - 1)

# Format dates
$startDateFormatted = $startDateParsed.ToString("yyyy-MM-dd")
$endDateFormatted = $endDateParsed.ToString("yyyy-MM-dd")
$startDateLong = $startDateParsed.ToString("MMMM dd, yyyy")
$endDateLong = $endDateParsed.ToString("MMMM dd, yyyy")

# Generate sprint filename
$sprintFileName = "sprint-{0:D3}.md" -f $SprintNumber
$sprintFilePath = "sprints/$sprintFileName"

# Check if sprint file already exists
if (Test-Path $sprintFilePath) {
    $overwrite = Read-Host "Sprint $SprintNumber already exists. Overwrite? (y/N)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Get stories from backlog for sprint planning
Write-Host "📋 Loading backlog for sprint planning..." -ForegroundColor Cyan

$backlogStories = @()
$storyFiles = Get-ChildItem "stories/*.md" -ErrorAction SilentlyContinue

foreach ($file in $storyFiles) {
    $content = Get-Content $file.FullName -Raw
    $storyName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    
    # Only include TODO stories
    if ($content -match '🟦.*TODO') {
        $storyTitle = if ($content -match '^# (.+)') { $matches[1] } else { "Unknown Title" }
        $storyPriority = if ($content -match '\*\*Priority\*\*:\s*([^\n]+)') { $matches[1].Trim() } else { "Medium" }
        $storyPoints = if ($content -match '\*\*Story Points\*\*:\s*([^\n]+)') { [int]$matches[1].Trim() } else { 0 }
        $storyEpic = if ($content -match '\*\*Epic\*\*:\s*([^\n]+)') { $matches[1].Trim() } else { "Unknown" }
        
        $backlogStories += [PSCustomObject]@{
            ID = $storyName
            Title = $storyTitle
            Priority = $storyPriority
            Points = $storyPoints
            Epic = $storyEpic
        }
    }
}

# Sort by priority and points
$priorityOrder = @{ "High" = 1; "Medium" = 2; "Low" = 3 }
$sortedStories = $backlogStories | Sort-Object { $priorityOrder[$_.Priority] }, Points -Descending

Write-Host "`n📊 Available stories for sprint planning:" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Gray

$runningTotal = 0
$suggestedStories = @()

foreach ($story in $sortedStories) {
    $priorityColor = switch ($story.Priority) {
        "High" { "Red" }
        "Medium" { "Yellow" }
        "Low" { "Green" }
        default { "White" }
    }
    
    $wouldExceedCapacity = ($runningTotal + $story.Points) -gt $Capacity
    
    Write-Host "[$($story.Points) pts] " -NoNewline -ForegroundColor Cyan
    Write-Host "$($story.ID): " -NoNewline -ForegroundColor Gray
    Write-Host $story.Title -NoNewline -ForegroundColor White
    Write-Host " (" -NoNewline -ForegroundColor Gray
    Write-Host $story.Priority -NoNewline -ForegroundColor $priorityColor
    Write-Host ")" -ForegroundColor Gray
    
    if (-not $wouldExceedCapacity -and $runningTotal -lt $Capacity) {
        $suggestedStories += $story
        $runningTotal += $story.Points
        Write-Host "    ✓ Fits in capacity (Running total: $runningTotal/$Capacity)" -ForegroundColor Green
    } else {
        Write-Host "    ⚠ Would exceed capacity" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 Suggested stories for Sprint $SprintNumber (Total: $runningTotal/$Capacity points):" -ForegroundColor Green
foreach ($story in $suggestedStories) {
    Write-Host "  - $($story.ID): $($story.Title) [$($story.Points) pts]" -ForegroundColor Gray
}

# Create sprint template
$sprintTemplate = @"
# Sprint $SprintNumber`: [Sprint Name]

**Sprint Goal**: $Goal  
**Duration**: $startDateLong - $endDateLong ($Duration days)  
**Team Capacity**: $Capacity story points  
**Committed Points**: [TBD] story points  

## 📊 Sprint Overview

[Brief description of what this sprint aims to achieve]

## 🎯 Sprint Objectives

1. **[Objective 1]**: [Description]
2. **[Objective 2]**: [Description]
3. **[Objective 3]**: [Description]

## 📋 Sprint Backlog

### 🟦 Committed Stories ([TBD] points)
[Add committed stories here - suggested stories listed below]

#### Suggested Stories (Total: $runningTotal points)
"@

foreach ($story in $suggestedStories) {
    $sprintTemplate += "`n- **$($story.ID)**: $($story.Title)"
    $sprintTemplate += "`n  - **Points**: $($story.Points)"
    $sprintTemplate += "`n  - **Priority**: $($story.Priority)"
    $sprintTemplate += "`n  - **Epic**: $($story.Epic)"
    $sprintTemplate += "`n"
}

$sprintTemplate += @"

### 🟩 Stretch Goals ([TBD] points)
[Stories to work on if primary goals are completed early]

## 📈 Sprint Progress

``````
Sprint $SprintNumber Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
Day 1 of $Duration`: ░░░░░░░░░░░░░░░░░░░░ 0%
``````

### Daily Progress
[Track daily progress here]

## 🎯 Key Results (Expected)

- **[Metric 1]**: [Target value]
- **[Metric 2]**: [Target value]
- **[Metric 3]**: [Target value]

## 🛠️ Technical Focus Areas

### [Focus Area 1]
[Description of technical focus]

### [Focus Area 2]
[Description of technical focus]

## 🚧 Risks & Mitigation

### Identified Risks
1. **[Risk 1]**: [Description]
   - **Mitigation**: [How to mitigate]

2. **[Risk 2]**: [Description]
   - **Mitigation**: [How to mitigate]

### Risk Status
- 🟦 **Low Risk**: [Description]
- 🟨 **Medium Risk**: [Description]
- 🟥 **High Risk**: [Description]

## 📅 Key Milestones

| Milestone | Target Date | Status |
|-----------|-------------|---------|
| [Milestone 1] | [Date] | 🟦 Planned |
| [Milestone 2] | [Date] | 🟦 Planned |
| Sprint Demo Prep | $endDateLong | 🟦 Planned |
| Sprint Retrospective | $endDateLong | 🟦 Planned |

## 🏆 Definition of Done

### Story Level
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance requirements met

### Sprint Level
- [ ] All committed stories completed
- [ ] Demo prepared and delivered
- [ ] Retrospective conducted
- [ ] Next sprint planning completed
- [ ] Technical debt documented

## 📊 Metrics Tracking

### Velocity
- **Previous Sprint**: [Previous sprint points]
- **Current Commitment**: [Committed points]
- **Target Completion**: 100%

### Quality
- **Bug Rate**: < 2 bugs per story
- **Test Coverage**: > 90%
- **Code Review**: 100% coverage

### Performance
- **[Performance Metric 1]**: [Target]
- **[Performance Metric 2]**: [Target]

## 👥 Team Assignments

### Development Team
[Assign stories to team members]

### DevOps/Infrastructure
[Infrastructure and deployment tasks]

## 📝 Sprint Notes

### Sprint Planning Notes
- **Planning Date**: $startDateFormatted
- **Team Availability**: [Note any team member availability issues]
- **Dependencies**: [Note any external dependencies]

### Daily Standup Schedule
- **Time**: [Daily standup time]
- **Format**: [In-person/remote/hybrid]

## 🔄 Next Sprint Preview

**Sprint $($SprintNumber + 1)** preview:
[High-level goals for the next sprint]

## 🔄 Sprint History

- **Sprint Planning**: $startDateFormatted
- **Daily Standups**: [Time] daily
- **Sprint Review**: $endDateFormatted
- **Sprint Retrospective**: $endDateFormatted
"@

# Create the sprint file
try {
    $sprintTemplate | Out-File -FilePath $sprintFilePath -Encoding UTF8
    Write-Host "`n✅ Sprint $SprintNumber created successfully!" -ForegroundColor Green
    Write-Host "   File: $sprintFilePath" -ForegroundColor Cyan
    Write-Host "   Duration: $startDateLong - $endDateLong" -ForegroundColor Cyan
    Write-Host "   Capacity: $Capacity story points" -ForegroundColor Cyan
    
    # Update current sprint file
    $currentSprintContent = @"
# Sprint $SprintNumber`: Current Sprint

This file links to the current active sprint.

**Current Sprint**: [Sprint $SprintNumber - [Sprint Name]](sprint-{0:D3}.md)

**Sprint Period**: $startDateLong - $endDateLong  
**Status**: 🟦 PLANNED (Day 0 of $Duration)  
**Progress**: 0% of committed stories  

## 🎯 Quick Status

- **Committed**: [TBD] story points
- **Completed**: 0 stories (0 points)
- **Remaining**: [TBD] stories

## 📋 Active Stories

[Stories will be listed here once sprint starts]

## 🔄 Links

- [Full Sprint Details](sprint-{0:D3}.md)
- [Sprint Backlog](../backlog.md)
- [Progress Tracking](../progress.md)
"@ -f $SprintNumber

    $currentSprintContent | Out-File -FilePath "sprints/current.md" -Encoding UTF8
    Write-Host "   Updated current sprint pointer" -ForegroundColor Green
    
    # Ask if user wants to open the file for editing
    $openFile = Read-Host "`nOpen sprint file for editing? (y/N)"
    if ($openFile -eq 'y' -or $openFile -eq 'Y') {
        if (Get-Command code -ErrorAction SilentlyContinue) {
            code $sprintFilePath
        } else {
            notepad $sprintFilePath
        }
    }
    
} catch {
    Write-Error "Failed to create sprint file: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Customize the sprint template with specific details" -ForegroundColor Gray
Write-Host "2. Finalize story selection and commitment" -ForegroundColor Gray
Write-Host "3. Update story files with sprint assignment" -ForegroundColor Gray
Write-Host "4. Schedule sprint planning meeting" -ForegroundColor Gray
Write-Host "5. Set up daily standup schedule" -ForegroundColor Gray
