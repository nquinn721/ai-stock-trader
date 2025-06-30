# Test Auto-Trading Endpoints After Deployment
# Usage: .\test-auto-trading-endpoints.ps1 -BaseUrl "https://your-cloud-run-url.run.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl
)

Write-Host "🧪 Testing auto-trading endpoints for: $BaseUrl" -ForegroundColor Green

function Test-Endpoint {
    param($Url, $Description)
    Write-Host ""
    Write-Host "$Description..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 30
        Write-Host "✅ $Description passed" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Description failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test 1: Health Check
Test-Endpoint "$BaseUrl/health" "1️⃣ Health endpoint"

# Test 2: General API Health
Test-Endpoint "$BaseUrl/api/stocks" "2️⃣ Stocks API"

# Test 3: Auto-trading health
Test-Endpoint "$BaseUrl/api/auto-trading/health" "3️⃣ Auto-trading health"

# Test 4: Active sessions endpoint (should work)
Test-Endpoint "$BaseUrl/api/auto-trading/sessions/active/all" "4️⃣ Active sessions endpoint"

# Test 5: Portfolio endpoint (should work for database test)
Test-Endpoint "$BaseUrl/api/portfolios" "5️⃣ Portfolios endpoint"

# Test 6: Database connection test (using paper-trading endpoint)
Test-Endpoint "$BaseUrl/api/paper-trading/portfolios" "6️⃣ Database connectivity via paper-trading"

Write-Host ""
Write-Host "🏁 Auto-trading endpoint testing complete!" -ForegroundColor Green
Write-Host "Note: To test session creation, you'll need a valid portfolio ID and session data." -ForegroundColor Yellow

# Example of testing session creation (commented out - needs portfolio ID)
<#
Write-Host ""
Write-Host "🔧 Example session creation test (commented out):" -ForegroundColor Cyan
Write-Host @"
`$sessionData = @{
    portfolio_id = "your-portfolio-id-here"
    session_name = "Test Session"
    config = @{
        strategy = "basic"
        risk_tolerance = "medium"
    }
}
`$response = Invoke-RestMethod -Uri "$BaseUrl/api/auto-trading/sessions/start" -Method Post -Body (`$sessionData | ConvertTo-Json) -ContentType "application/json"
"@ -ForegroundColor Gray
#>
