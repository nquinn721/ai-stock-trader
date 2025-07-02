# Update Cloud Build Database Configuration
# This script updates cloudbuild.yaml with your database credentials from database-config.env

Write-Host "🔄 Updating Cloud Build database configuration..." -ForegroundColor Green

# Check if database-config.env exists
if (-not (Test-Path "database-config.env")) {
    Write-Host "❌ database-config.env file not found!" -ForegroundColor Red
    Write-Host "Please create and configure the database-config.env file first." -ForegroundColor Yellow
    exit 1
}

# Read configuration from file
$config = @{}
Get-Content "database-config.env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $config[$key] = $value
    }
}

# Validate required configuration
$requiredKeys = @('DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USERNAME', 'DATABASE_PASSWORD', 'DATABASE_NAME')
$missing = @()

foreach ($key in $requiredKeys) {
    if (-not $config.ContainsKey($key) -or $config[$key] -like '*YOUR_*' -or -not $config[$key]) {
        $missing += $key
    }
}

if ($missing.Count -gt 0) {
    Write-Host "❌ Missing or incomplete configuration for:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Please update database-config.env with your actual database credentials." -ForegroundColor Yellow
    exit 1
}

# Create environment variables string
$envVars = "NODE_ENV=production,TFJS_BACKEND=cpu,TFJS_DISABLE_WEBGL=true,DATABASE_HOST=$($config['DATABASE_HOST']),DATABASE_PORT=$($config['DATABASE_PORT']),DATABASE_USERNAME=$($config['DATABASE_USERNAME']),DATABASE_PASSWORD=$($config['DATABASE_PASSWORD']),DATABASE_NAME=$($config['DATABASE_NAME'])"

# Read current cloudbuild.yaml
$cloudbuildPath = "cloudbuild.yaml"
if (-not (Test-Path $cloudbuildPath)) {
    Write-Host "❌ cloudbuild.yaml not found!" -ForegroundColor Red
    exit 1
}

$content = Get-Content $cloudbuildPath -Raw

# Replace the environment variables in the Cloud Run deploy step
$oldPattern = '("--set-env-vars",\s*"[^"]*"(?:,\s*"--set-secrets",\s*"[^"]*")?)'
$newReplacement = """--set-env-vars"",`n        ""$envVars"""

$newContent = $content -replace $oldPattern, $newReplacement

# Write back to file
$newContent | Set-Content $cloudbuildPath -NoNewline

Write-Host "✅ Cloud Build configuration updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Database configuration:" -ForegroundColor Blue
Write-Host "   Host: $($config['DATABASE_HOST'])" -ForegroundColor Gray
Write-Host "   Port: $($config['DATABASE_PORT'])" -ForegroundColor Gray
Write-Host "   Username: $($config['DATABASE_USERNAME'])" -ForegroundColor Gray
Write-Host "   Database: $($config['DATABASE_NAME'])" -ForegroundColor Gray
Write-Host "   Password: [HIDDEN]" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Ready to deploy! Run your Cloud Build to deploy with the new database configuration." -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Note: This uses environment variables instead of secrets." -ForegroundColor Yellow
Write-Host "   For production, consider using Google Secret Manager for better security." -ForegroundColor Yellow
