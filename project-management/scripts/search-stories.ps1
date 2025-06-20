# 🔍 Advanced Story Search Script
# Usage: .\search-stories.ps1 -Query "breakout" -Status "in_progress" -Epic "ml-trading"

param(
    [string]$Query = "",
    [string]$Status = "",
    [string]$Epic = "",
    [string]$Priority = "",
    [string]$Sprint = "",
    [string]$Assignee = "",
    [switch]$ShowDetails = $false,
    [switch]$ExportResults = $false
)

# Set working directory to project management
$ProjectMgmtPath = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectMgmtPath

# Initialize results array
$results = @()

# Get all story files
$storyFiles = Get-ChildItem "stories/*.md" -ErrorAction SilentlyContinue

if ($storyFiles.Count -eq 0) {
    Write-Host "No story files found in stories/ directory" -ForegroundColor Yellow
    exit 0
}

Write-Host "🔍 Searching through $($storyFiles.Count) stories..." -ForegroundColor Cyan

foreach ($file in $storyFiles) {
    $content = Get-Content $file.FullName -Raw
    $storyName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    
    # Extract story metadata
    $storyTitle = if ($content -match '^# (.+)') { $matches[1] } else { "Unknown Title" }
    $storyStatus = if ($content -match '\*\*Status\*\*:\s*([^\n]+)') { $matches[1].Trim() } else { "Unknown" }
    $storyPriority = if ($content -match '\*\*Priority\*\*:\s*([^\n]+)') { $matches[1].Trim() } else { "Unknown" }
    $storyEpic = if ($content -match '\*\*Epic\*\*:\s*([^\n]+)') { $matches[1].Trim() } else { "Unknown" }
    $storySprint = if ($content -match '\*\*Sprint\*\*:\s*([^\n]+)') { $matches[1].Trim() } else { "Unassigned" }
    $storyAssignee = if ($content -match '\*\*Assignee\*\*:\s*([^\n]+)') { $matches[1].Trim() } else { "Unassigned" }
    $storyPoints = if ($content -match '\*\*Story Points\*\*:\s*([^\n]+)') { $matches[1].Trim() } else { "0" }
    
    # Apply filters
    $matchesFilters = $true
    
    # Text query filter
    if ($Query -and $content -notmatch [regex]::Escape($Query)) {
        $matchesFilters = $false
    }
    
    # Status filter
    if ($Status) {
        $statusNormalized = switch ($Status.ToLower()) {
            "todo" { "🟦.*TODO" }
            "in_progress" { "🟨.*IN.?PROGRESS" }
            "done" { "🟩.*(DONE|COMPLETED)" }
            "blocked" { "🟥.*BLOCKED" }
            "review" { "🔄.*REVIEW" }
            default { [regex]::Escape($Status) }
        }
        if ($storyStatus -notmatch $statusNormalized) {
            $matchesFilters = $false
        }
    }
    
    # Epic filter
    if ($Epic -and $storyEpic -notmatch [regex]::Escape($Epic)) {
        $matchesFilters = $false
    }
    
    # Priority filter
    if ($Priority -and $storyPriority -notmatch [regex]::Escape($Priority)) {
        $matchesFilters = $false
    }
    
    # Sprint filter
    if ($Sprint -and $storySprint -notmatch [regex]::Escape($Sprint)) {
        $matchesFilters = $false
    }
    
    # Assignee filter
    if ($Assignee -and $storyAssignee -notmatch [regex]::Escape($Assignee)) {
        $matchesFilters = $false
    }
    
    # If all filters match, add to results
    if ($matchesFilters) {
        $storyInfo = [PSCustomObject]@{
            ID = $storyName
            Title = $storyTitle
            Status = $storyStatus
            Priority = $storyPriority
            Epic = $storyEpic
            Sprint = $storySprint
            Assignee = $storyAssignee
            Points = $storyPoints
            FilePath = $file.FullName
            Content = $content
        }
        $results += $storyInfo
    }
}

# Display results
if ($results.Count -eq 0) {
    Write-Host "❌ No stories found matching the criteria" -ForegroundColor Red
    exit 0
}

Write-Host "`n✅ Found $($results.Count) matching stories:" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Gray

foreach ($story in $results) {
    # Color code status
    $statusColor = switch -Regex ($story.Status) {
        "🟩|DONE|COMPLETED" { "Green" }
        "🟨|IN.?PROGRESS" { "Yellow" }
        "🟥|BLOCKED" { "Red" }
        "🟦|TODO" { "Blue" }
        default { "White" }
    }
    
    # Priority color
    $priorityColor = switch -Regex ($story.Priority) {
        "High" { "Red" }
        "Medium" { "Yellow" }
        "Low" { "Green" }
        default { "White" }
    }
    
    Write-Host "`n📋 $($story.ID): " -NoNewline -ForegroundColor Cyan
    Write-Host $story.Title -ForegroundColor White
    
    Write-Host "   Status: " -NoNewline -ForegroundColor Gray
    Write-Host $story.Status -ForegroundColor $statusColor
    
    Write-Host "   Priority: " -NoNewline -ForegroundColor Gray
    Write-Host $story.Priority -NoNewline -ForegroundColor $priorityColor
    Write-Host " | Epic: " -NoNewline -ForegroundColor Gray
    Write-Host $story.Epic -NoNewline -ForegroundColor Magenta
    Write-Host " | Points: " -NoNewline -ForegroundColor Gray
    Write-Host $story.Points -ForegroundColor Cyan
    
    if ($story.Sprint -ne "Unassigned") {
        Write-Host "   Sprint: " -NoNewline -ForegroundColor Gray
        Write-Host $story.Sprint -NoNewline -ForegroundColor DarkCyan
    }
    
    if ($story.Assignee -ne "Unassigned") {
        Write-Host " | Assignee: " -NoNewline -ForegroundColor Gray
        Write-Host $story.Assignee -ForegroundColor DarkYellow
    } else {
        Write-Host ""
    }
    
    # Show additional details if requested
    if ($ShowDetails) {
        Write-Host "   File: " -NoNewline -ForegroundColor Gray
        Write-Host $story.FilePath -ForegroundColor DarkGray
        
        # Extract and show acceptance criteria count
        $criteriaMatches = [regex]::Matches($story.Content, '- \[[ x]\]')
        $totalCriteria = $criteriaMatches.Count
        $completedCriteria = ($criteriaMatches | Where-Object { $_.Value -match '\[x\]' }).Count
        
        if ($totalCriteria -gt 0) {
            $criteriaPercent = [math]::Round(($completedCriteria / $totalCriteria) * 100, 1)
            Write-Host "   Acceptance Criteria: " -NoNewline -ForegroundColor Gray
            Write-Host "$completedCriteria/$totalCriteria completed ($criteriaPercent%)" -ForegroundColor DarkGreen
        }
        
        # Show first few lines of description
        if ($story.Content -match '## 📋 Description\s*\n\n([^\n]+)') {
            $description = $matches[1].Substring(0, [Math]::Min(100, $matches[1].Length))
            Write-Host "   Description: " -NoNewline -ForegroundColor Gray
            Write-Host "$description..." -ForegroundColor DarkGray
        }
    }
}

# Summary statistics
Write-Host "`n" + ("=" * 80) -ForegroundColor Gray
Write-Host "📊 Search Results Summary:" -ForegroundColor Cyan

$statusGroups = $results | Group-Object { $_.Status -replace '[🟦🟨🟩🟥🔄]', '' -replace '\s+', ' ' } | Sort-Object Name
foreach ($group in $statusGroups) {
    Write-Host "   $($group.Name): $($group.Count) stories" -ForegroundColor Gray
}

$totalPoints = ($results | ForEach-Object { [int]$_.Points } | Measure-Object -Sum).Sum
Write-Host "   Total Story Points: $totalPoints" -ForegroundColor Gray

# Export results if requested
if ($ExportResults) {
    $timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
    $exportFile = "reports/search-results-$timestamp.csv"
    
    # Ensure reports directory exists
    New-Item -Path "reports" -ItemType Directory -Force | Out-Null
    
    $results | Select-Object ID, Title, Status, Priority, Epic, Sprint, Assignee, Points | 
        Export-Csv -Path $exportFile -NoTypeInformation -Encoding UTF8
    
    Write-Host "`n💾 Results exported to: $exportFile" -ForegroundColor Green
}

# Show available commands
Write-Host "`n💡 Tip: Use these filters for common searches:" -ForegroundColor DarkCyan
Write-Host "   .\search-stories.ps1 -Status 'in_progress'  # Find active stories" -ForegroundColor DarkGray
Write-Host "   .\search-stories.ps1 -Epic 'ml-trading'     # Find ML-related stories" -ForegroundColor DarkGray
Write-Host "   .\search-stories.ps1 -Query 'API'           # Text search" -ForegroundColor DarkGray
Write-Host "   .\search-stories.ps1 -ShowDetails           # Detailed view" -ForegroundColor DarkGray
