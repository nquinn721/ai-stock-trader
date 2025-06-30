# Setup Database Secrets for Cloud Run Deployment
# This script creates secrets in Google Secret Manager for secure database connection

Write-Host "🔐 Setting up database secrets for Cloud Run deployment..." -ForegroundColor Green

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ gcloud CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if user is authenticated
$authCheck = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authCheck) {
    Write-Host "❌ Not authenticated with gcloud. Please run 'gcloud auth login' first." -ForegroundColor Red
    exit 1
}

# Get current project
$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Host "❌ No project set. Please run 'gcloud config set project YOUR_PROJECT_ID' first." -ForegroundColor Red
    exit 1
}

Write-Host "📍 Using project: $PROJECT_ID" -ForegroundColor Blue

# Prompt for database connection details
Write-Host ""
Write-Host "Please provide your MySQL database connection details:" -ForegroundColor Yellow
Write-Host ""

$DB_HOST = Read-Host "Database Host (e.g., 34.123.45.67 or your-instance.us-central1.gcp.cloud.sql.proxy)"
$DB_PORT = Read-Host "Database Port (default: 3306)"
$DB_USERNAME = Read-Host "Database Username"
$DB_PASSWORD = Read-Host "Database Password" -AsSecureString
$DB_NAME = Read-Host "Database Name"

# Convert secure string to plain text for gcloud
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

# Set defaults
if (-not $DB_PORT) { $DB_PORT = "3306" }

# Validate inputs
if (-not $DB_HOST -or -not $DB_USERNAME -or -not $DB_PASSWORD_PLAIN -or -not $DB_NAME) {
    Write-Host "❌ All database connection details are required." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Creating secrets in Google Secret Manager..." -ForegroundColor Blue

# Create secrets
try {
    $DB_HOST | gcloud secrets create database-host --data-file=-
    $DB_PORT | gcloud secrets create database-port --data-file=-
    $DB_USERNAME | gcloud secrets create database-username --data-file=-
    $DB_PASSWORD_PLAIN | gcloud secrets create database-password --data-file=-
    $DB_NAME | gcloud secrets create database-name --data-file=-
    
    Write-Host ""
    Write-Host "✅ Database secrets created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating secrets: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure your Cloud Run service account has access to these secrets"
Write-Host "2. Grant the Cloud Run service account the 'Secret Manager Secret Accessor' role"
Write-Host "3. Deploy your application using Cloud Build"
Write-Host ""
Write-Host "To grant secret access to Cloud Run, run:" -ForegroundColor Cyan
Write-Host "gcloud projects add-iam-policy-binding $PROJECT_ID \"
Write-Host "    --member='serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com' \"
Write-Host "    --role='roles/secretmanager.secretAccessor'"
Write-Host ""
Write-Host "🚀 Your database configuration is now secure and ready for Cloud Run deployment!" -ForegroundColor Green
