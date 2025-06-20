# 📝 Create New Story Script
# Usage: .\create-story.ps1 -Title "Story Title" -Epic "epic-name" -Priority "high"

param(
    [Parameter(Mandatory=$true)]
    [string]$Title,
    
    [Parameter(Mandatory=$true)]
    [string]$Epic,
    
    [string]$Priority = "medium",
    [int]$StoryPoints = 0,
    [string]$Sprint = "",
    [string]$Assignee = "Unassigned",
    [string]$Dependencies = "",
    [switch]$Interactive = $false
)

# Set working directory to project management
$ProjectMgmtPath = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectMgmtPath

# Interactive mode
if ($Interactive) {
    $Title = Read-Host "Story Title"
    $Epic = Read-Host "Epic (e.g., 002-ml-trading-enhancement)"
    $Priority = Read-Host "Priority (high/medium/low) [medium]"
    if ([string]::IsNullOrWhiteSpace($Priority)) { $Priority = "medium" }
    
    $pointsInput = Read-Host "Story Points (1-13) [0]"
    if ([string]::IsNullOrWhiteSpace($pointsInput)) { $StoryPoints = 0 }
    else { $StoryPoints = [int]$pointsInput }
    
    $Sprint = Read-Host "Sprint (leave empty if not assigned)"
    $Assignee = Read-Host "Assignee [Unassigned]"
    if ([string]::IsNullOrWhiteSpace($Assignee)) { $Assignee = "Unassigned" }
    
    $Dependencies = Read-Host "Dependencies (comma-separated story IDs)"
}

# Validate inputs
$validPriorities = @("high", "medium", "low")
if ($Priority -notin $validPriorities) {
    Write-Error "Priority must be one of: $($validPriorities -join ', ')"
    exit 1
}

if ($StoryPoints -lt 0 -or $StoryPoints -gt 13) {
    Write-Warning "Story points should typically be between 1-13 (Fibonacci sequence)"
}

# Generate story ID
$existingStories = Get-ChildItem "stories/*.md" -ErrorAction SilentlyContinue
$storyNumbers = $existingStories | ForEach-Object {
    if ($_.BaseName -match '^(\d+)') { [int]$matches[1] }
} | Sort-Object

$nextStoryId = if ($storyNumbers) { ($storyNumbers | Measure-Object -Maximum).Maximum + 1 } else { 1 }
$storyIdFormatted = "{0:D3}" -f $nextStoryId

# Generate filename
$fileName = "$storyIdFormatted-$(($Title -replace '[^\w\s-]', '') -replace '\s+', '-').md".ToLower()
$filePath = "stories/$fileName"

# Determine status emoji and text
$statusEmoji = "🟦"
$statusText = "TODO"

# Create user story description template
$userStoryTemplate = @"
**As a** [user type]  
**I want** [functionality]  
**So that** [benefit/value]  
"@

# Generate story content
$timestamp = Get-Date -Format "yyyy-MM-dd"
$sprintText = if ($Sprint) { $Sprint } else { "Unassigned" }
$dependenciesText = if ($Dependencies) { $Dependencies } else { "None" }

$storyContent = @"
# Story $storyIdFormatted`: $Title

**Status**: $statusEmoji $statusText  
**Priority**: $(($Priority.Substring(0,1).ToUpper() + $Priority.Substring(1)))  
**Epic**: $Epic  
**Sprint**: $sprintText  
**Story Points**: $StoryPoints  
**Assignee**: $Assignee  
**Dependencies**: $dependenciesText  

## 📖 User Story

$userStoryTemplate

## 📋 Description

[Provide detailed description of the story, including context and requirements]

## ✅ Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] [Add more criteria as needed]

## 🔧 Technical Details

### Implementation Notes
[Technical requirements, constraints, and implementation guidance]

### Architecture Changes
[Any changes to system architecture or design patterns]

### Database Changes
[Schema changes, migrations, new tables/fields]

## 📊 Progress Tracking

``````
Story Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
``````

### ✅ Completed Tasks
- [ ] [Task will be marked as completed]

### 🟨 In Progress
- [ ] [Tasks currently being worked on]

### 🟦 Remaining Tasks
- [ ] [Analysis and design]
- [ ] [Implementation]
- [ ] [Testing]
- [ ] [Documentation]
- [ ] [Code review]

## 🧪 Testing Strategy

### Unit Tests
- [ ] [Specific unit test requirements]

### Integration Tests
- [ ] [Integration testing scenarios]

### Manual Testing
- [ ] [Manual testing checklist]

## 📁 Files to Create/Modify

### New Files
- [ ] `[List new files to be created]`

### Modified Files
- [ ] `[List existing files to be modified]`

## 🔗 Dependencies

[List any dependencies on other stories, external systems, or third-party services]

## 📊 Success Metrics

- **Performance**: [Performance requirements]
- **Quality**: [Quality metrics]
- **User Experience**: [UX metrics]

## 🚧 Risks & Mitigation

- **Risk 1**: [Description] - *Mitigation*: [How to mitigate]
- **Risk 2**: [Description] - *Mitigation*: [How to mitigate]

## 📝 Notes

[Additional notes, assumptions, or context]

## 🔄 Story History

- **Created**: $timestamp
- **Last Updated**: $timestamp
- **Status Changes**: 
  - $timestamp: Created as $statusText
"@

# Create the story file
try {
    $storyContent | Out-File -FilePath $filePath -Encoding UTF8
    Write-Host "✅ Story created successfully!" -ForegroundColor Green
    Write-Host "   File: $filePath" -ForegroundColor Cyan
    Write-Host "   ID: $storyIdFormatted" -ForegroundColor Cyan
    Write-Host "   Title: $Title" -ForegroundColor Cyan
    
    # Update backlog file
    $backlogPath = "backlog.md"
    if (Test-Path $backlogPath) {
        $backlogContent = Get-Content $backlogPath -Raw
        
        # Find the appropriate section based on priority
        $sectionHeader = switch ($Priority) {
            "high" { "## 🚨 High Priority" }
            "medium" { "## 📊 Medium Priority" }
            "low" { "## 🔧 Low Priority" }
        }
        
        $newEntry = "- **$storyIdFormatted**: $Title"
        
        # Add to backlog (simplified - could be more sophisticated)
        Write-Host "📋 Consider adding to backlog.md manually:" -ForegroundColor Yellow
        Write-Host "   $newEntry" -ForegroundColor Gray
    }
    
    # Ask if user wants to open the file for editing
    $openFile = Read-Host "Open story file for editing? (y/N)"
    if ($openFile -eq 'y' -or $openFile -eq 'Y') {
        if (Get-Command code -ErrorAction SilentlyContinue) {
            code $filePath
        } else {
            notepad $filePath
        }
    }
    
} catch {
    Write-Error "Failed to create story file: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit the story file to add specific details" -ForegroundColor Gray
Write-Host "2. Update the backlog.md if needed" -ForegroundColor Gray
Write-Host "3. Add to current sprint if ready for development" -ForegroundColor Gray
Write-Host "4. Update epic file with new story reference" -ForegroundColor Gray
