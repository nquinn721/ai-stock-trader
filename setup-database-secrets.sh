#!/bin/bash

# Setup Database Secrets for Cloud Run Deployment
# This script creates secrets in Google Secret Manager for secure database connection

echo "🔐 Setting up database secrets for Cloud Run deployment..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project set. Please run 'gcloud config set project YOUR_PROJECT_ID' first."
    exit 1
fi

echo "📍 Using project: $PROJECT_ID"

# Prompt for database connection details
echo ""
echo "Please provide your MySQL database connection details:"
echo ""

read -p "Database Host (e.g., 34.123.45.67 or your-instance.us-central1.gcp.cloud.sql.proxy): " DB_HOST
read -p "Database Port (default: 3306): " DB_PORT
read -p "Database Username: " DB_USERNAME
read -s -p "Database Password: " DB_PASSWORD
echo ""
read -p "Database Name: " DB_NAME

# Set defaults
DB_PORT=${DB_PORT:-3306}

# Validate inputs
if [ -z "$DB_HOST" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo "❌ All database connection details are required."
    exit 1
fi

echo ""
echo "🔄 Creating secrets in Google Secret Manager..."

# Create secrets
echo "$DB_HOST" | gcloud secrets create database-host --data-file=-
echo "$DB_PORT" | gcloud secrets create database-port --data-file=-
echo "$DB_USERNAME" | gcloud secrets create database-username --data-file=-
echo "$DB_PASSWORD" | gcloud secrets create database-password --data-file=-
echo "$DB_NAME" | gcloud secrets create database-name --data-file=-

echo ""
echo "✅ Database secrets created successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Ensure your Cloud Run service account has access to these secrets"
echo "2. Grant the Cloud Run service account the 'Secret Manager Secret Accessor' role"
echo "3. Deploy your application using Cloud Build"
echo ""
echo "To grant secret access to Cloud Run, run:"
echo "gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "    --member='serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com' \\"
echo "    --role='roles/secretmanager.secretAccessor'"
echo ""
echo "🚀 Your database configuration is now secure and ready for Cloud Run deployment!"
