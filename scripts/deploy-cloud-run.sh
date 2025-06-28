#!/bin/bash

# Cloud Run Deployment Script for Stock Trading App
# This script builds and deploys the application to Google Cloud Run

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-""}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
SERVICE_NAME="stock-trading-app"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Database configuration
DB_HOST=${DB_HOST:-""}
DB_USERNAME=${DB_USERNAME:-"stocktrader"}
DB_PASSWORD=${DB_PASSWORD:-""}
DB_NAME=${DB_NAME:-"stocktrading"}

echo -e "${GREEN}🚀 Starting Cloud Run deployment for Stock Trading App${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  GOOGLE_CLOUD_PROJECT is not set. Please set it:${NC}"
    echo "export GOOGLE_CLOUD_PROJECT=your-project-id"
    echo "Or run: gcloud config set project your-project-id"
    exit 1
fi

echo -e "${GREEN}📋 Configuration:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"
echo "  Image: $IMAGE_NAME"
echo "  Database Host: ${DB_HOST:-'Not configured'}"
echo "  Database Name: ${DB_NAME:-'Not configured'}"
echo ""

# Check database configuration
if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  Database configuration not complete.${NC}"
    echo "Please set the following environment variables:"
    echo "  export DB_HOST=/cloudsql/your-project:region:instance-name"
    echo "  export DB_USERNAME=stocktrader"
    echo "  export DB_PASSWORD=your-secure-password"
    echo "  export DB_NAME=stocktrading"
    echo ""
    echo "Or update the substitution variables in cloudbuild.yaml"
    echo ""
fi

# Build and submit using Cloud Build
echo -e "${GREEN}🔨 Building application with Cloud Build...${NC}"

# Build with database configuration if provided
if [ -n "$DB_HOST" ] && [ -n "$DB_PASSWORD" ]; then
    echo "Using provided database configuration..."
    gcloud builds submit --config cloudbuild.yaml \
      --substitutions _REGION="$REGION",_DB_HOST="$DB_HOST",_DB_USERNAME="$DB_USERNAME",_DB_PASSWORD="$DB_PASSWORD",_DB_NAME="$DB_NAME"
else
    echo "Using default database configuration from cloudbuild.yaml..."
    gcloud builds submit --config cloudbuild.yaml --substitutions _REGION="$REGION"
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}🌐 Service URL:${NC}"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"
echo ""
echo -e "${GREEN}📊 Service Status:${NC}"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(metadata.name,status.url,status.conditions.type,status.conditions.status)"
