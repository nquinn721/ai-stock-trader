# 🚀 Start New Sprint Script
# Usage: .\start-sprint.ps1 -SprintNumber 4 -Goal "UI Enhancement" -StartDate "2025-01-28"

param(
    [Parameter(Mandatory=$true)]
    [int]$SprintNumber,
    
    [Parameter(Mandatory=$true)]
    [string]$Goal,
    
    [string]$StartDate = "",
    [int]$Duration = 14,
    [int]$Capacity = 40,
    [switch]$Interactive = $false
)

# Set working directory to project management
$ProjectMgmtPath = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectMgmtPath

# Interactive mode
if ($Interactive) {
    $SprintNumber = [int](Read-Host "Sprint Number")
    $Goal = Read-Host "Sprint Goal"
    $startInput = Read-Host "Start Date (YYYY-MM-DD) [today]"
    if ([string]::IsNullOrWhiteSpace($startInput)) { 
        $StartDate = Get-Date -Format "yyyy-MM-dd"
    } else { 
        $StartDate = $startInput 
    }
    
    $durationInput = Read-Host "Duration in days [14]"
    if ([string]::IsNullOrWhiteSpace($durationInput)) { $Duration = 14 }
    else { $Duration = [int]$durationInput }
    
    $capacityInput = Read-Host "Team capacity in story points [40]"
    if ([string]::IsNullOrWhiteSpace($capacityInput)) { $Capacity = 40 }
    else { $Capacity = [int]$capacityInput }
}

# Default start date to today if not provided
if ([string]::IsNullOrWhiteSpace($StartDate)) {
    $StartDate = Get-Date -Format "yyyy-MM-dd"
}

# Calculate end date
$startDateObj = [DateTime]::ParseExact($StartDate, "yyyy-MM-dd", $null)
$endDateObj = $startDateObj.AddDays($Duration)
$EndDate = $endDateObj.ToString("yyyy-MM-dd")

Write-Host "🚀 Creating Sprint $SprintNumber..." -ForegroundColor Cyan

# Check if sprint already exists
$sprintFile = "sprints/sprint-{0:D3}.md" -f $SprintNumber
if (Test-Path $sprintFile) {
    Write-Error "Sprint $SprintNumber already exists at $sprintFile"
    exit 1
}

# Generate sprint content
$sprintContent = @"
# Sprint $SprintNumber`: $Goal

**Sprint Goal**: $Goal  
**Duration**: $StartDate - $EndDate ($Duration days)  
**Team Capacity**: $Capacity story points  
**Committed Points**: 0 story points  

## 📊 Sprint Overview

This sprint focuses on [sprint objectives and key deliverables].

## 🎯 Sprint Objectives

1. **Objective 1**: [Description]
2. **Objective 2**: [Description]
3. **Objective 3**: [Description]

## 📋 Sprint Backlog

### 🟦 Committed Stories (0 points)
[Add committed stories here]

### 🟩 Stretch Goals (0 points)
[Add stretch goal stories here]

## 📈 Sprint Progress

``````
Sprint $SprintNumber Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
Day 1 of $Duration: █░░░░░░░░░░░░░░ 7%
``````

### Daily Progress
- **Day 1**: Sprint started
- **Day 2**: [Update daily]
- **Day 3**: [Update daily]

## 🎯 Key Results (Expected)

- **Result 1**: [Measurable outcome]
- **Result 2**: [Measurable outcome]
- **Result 3**: [Measurable outcome]

## 🛠️ Technical Focus Areas

### [Focus Area 1]
[Description and goals]

### [Focus Area 2]
[Description and goals]

## 🚧 Risks & Mitigation

### Identified Risks
1. **Risk 1**: [Description]
   - **Mitigation**: [How to mitigate]

2. **Risk 2**: [Description]
   - **Mitigation**: [How to mitigate]

### Risk Status
- 🟦 **Low Risk**: [Areas with low risk]
- 🟨 **Medium Risk**: [Areas with medium risk]
- 🟥 **High Risk**: [Areas with high risk]

## 📅 Key Milestones

| Milestone | Target Date | Status |
|-----------|-------------|---------|
| [Milestone 1] | [Date] | 🟦 Planned |
| [Milestone 2] | [Date] | 🟦 Planned |
| Sprint Demo Prep | $($endDateObj.AddDays(-1).ToString("MMM dd, yyyy")) | 🟦 Planned |
| Sprint Retrospective | $($endDateObj.ToString("MMM dd, yyyy")) | 🟦 Planned |

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
- **Previous Sprint**: [Previous points] points
- **Current Commitment**: 0 points
- **Target Completion**: 100%

### Quality
- **Bug Rate**: < 2 bugs per story
- **Test Coverage**: > 90%
- **Code Review**: 100% coverage

### Performance
- **[Metric 1]**: [Target]
- **[Metric 2]**: [Target]
- **System Uptime**: > 99%

## 👥 Team Assignments

### Development Team
- **[Story/Epic]**: [Assignment details]

### DevOps/Infrastructure
- **[Task]**: [Assignment details]

## 📝 Sprint Notes

### Planning Session
- **Date**: $StartDate
- **Participants**: [Team members]
- **Decisions**: [Key decisions made]

### Daily Standups
- **Time**: [Daily standup time]
- **Format**: [In-person/Remote]

## 🔄 Next Sprint Preview

**Sprint $($SprintNumber + 1)** will focus on:
- [Preview of next sprint goals]

## 🔄 Sprint History

- **Sprint Planning**: $StartDate
- **Daily Standups**: [Time] daily
- **Sprint Review**: $EndDate
- **Sprint Retrospective**: $EndDate
"@

# Create the sprint file
try {
    $sprintContent | Out-File -FilePath $sprintFile -Encoding UTF8
    
    # Update current.md to point to new sprint
    $currentContent = @"
# Sprint $SprintNumber`: Current Sprint

This file links to the current active sprint.

**Current Sprint**: [Sprint $SprintNumber - $Goal](sprint-{0:D3}.md)

**Sprint Period**: $StartDate - $EndDate  
**Status**: 🟦 PLANNED (Day 1 of $Duration)  
**Progress**: 0% of committed stories  

## 🎯 Quick Status

- **Committed**: 0 story points
- **Completed**: 0 stories
- **Remaining**: All stories

## 📋 Active Stories

[No stories committed yet]

## 🔄 Links

- [Full Sprint Details](sprint-{0:D3}.md)
- [Sprint Backlog](../backlog.md)
- [Progress Tracking](../progress.md)
"@ -f $SprintNumber

    $currentContent | Out-File -FilePath "sprints/current.md" -Encoding UTF8
    
    Write-Host "✅ Sprint $SprintNumber created successfully!" -ForegroundColor Green
    Write-Host "   File: $sprintFile" -ForegroundColor Cyan
    Write-Host "   Goal: $Goal" -ForegroundColor Cyan
    Write-Host "   Duration: $StartDate to $EndDate" -ForegroundColor Cyan
    
    # Ask if user wants to open the file for editing
    $openFile = Read-Host "Open sprint file for editing? (y/N)"
    if ($openFile -eq 'y' -or $openFile -eq 'Y') {
        if (Get-Command code -ErrorAction SilentlyContinue) {
            code $sprintFile
        } else {
            notepad $sprintFile
        }
    }
    
} catch {
    Write-Error "Failed to create sprint file: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add stories to the sprint backlog" -ForegroundColor Gray
Write-Host "2. Update story files with sprint assignment" -ForegroundColor Gray
Write-Host "3. Conduct sprint planning meeting" -ForegroundColor Gray
Write-Host "4. Update progress.md with new sprint info" -ForegroundColor Gray
