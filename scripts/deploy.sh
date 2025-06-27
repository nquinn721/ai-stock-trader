#!/bin/bash

# AI Stock Trader - Cloud Run Deployment Script
# This script deploys the full-stack application to Google Cloud Run

set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-project-id}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="ai-stock-trader"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
DATABASE_INSTANCE_NAME="${DATABASE_INSTANCE_NAME:-ai-stock-trader-db}"
DATABASE_NAME="${DATABASE_NAME:-stocktrader}"
DATABASE_USER="${DATABASE_USER:-stocktrader_user}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Authenticate and set project
setup_gcloud() {
    print_status "Setting up Google Cloud configuration..."
    
    # Set the project
    gcloud config set project ${PROJECT_ID}
    
    # Enable required APIs
    print_status "Enabling required Google Cloud APIs..."
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        sqladmin.googleapis.com \
        secretmanager.googleapis.com \
        artifactregistry.googleapis.com
    
    print_success "Google Cloud setup complete"
}

# Build and push Docker image
build_and_push() {
    print_status "Building Docker image..."
    
    # Build the image
    docker build -t ${IMAGE_NAME}:latest .
    
    print_status "Pushing image to Google Container Registry..."
    docker push ${IMAGE_NAME}:latest
    
    print_success "Image built and pushed successfully"
}

# Deploy to Cloud Run
deploy_to_cloud_run() {
    print_status "Deploying to Cloud Run..."
    
    # Get database connection string
    DB_CONNECTION_NAME=$(gcloud sql instances describe ${DATABASE_INSTANCE_NAME} --format="value(connectionName)" 2>/dev/null || echo "")
    
    if [ -z "$DB_CONNECTION_NAME" ]; then
        print_warning "Database instance not found. Please create it first using scripts/setup-database.sh"
        DB_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DATABASE_INSTANCE_NAME}"
    fi
    
    # Deploy to Cloud Run
    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME}:latest \
        --region ${REGION} \
        --platform managed \
        --allow-unauthenticated \
        --port 8080 \
        --memory 2Gi \
        --cpu 2 \
        --min-instances 0 \
        --max-instances 10 \
        --concurrency 80 \
        --timeout 300 \
        --add-cloudsql-instances ${DB_CONNECTION_NAME} \
        --set-env-vars "NODE_ENV=production" \
        --set-env-vars "PORT=8080" \
        --set-env-vars "DB_HOST=/cloudsql/${DB_CONNECTION_NAME}" \
        --set-env-vars "DB_PORT=3306" \
        --set-env-vars "DB_NAME=${DATABASE_NAME}" \
        --set-env-vars "DB_USERNAME=${DATABASE_USER}" \
        --set-secrets "DB_PASSWORD=db-password:latest"
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
    
    print_success "Deployment completed successfully!"
    print_success "Service URL: ${SERVICE_URL}"
    print_success "API Documentation: ${SERVICE_URL}/api"
}

# Main deployment function
main() {
    print_status "Starting AI Stock Trader deployment to Google Cloud Run..."
    
    # Validate project ID
    if [ "$PROJECT_ID" = "your-project-id" ]; then
        print_error "Please set your Google Cloud Project ID in the GOOGLE_CLOUD_PROJECT environment variable"
        print_error "Example: export GOOGLE_CLOUD_PROJECT=my-project-123"
        exit 1
    fi
    
    check_dependencies
    setup_gcloud
    build_and_push
    deploy_to_cloud_run
    
    print_success "✅ Deployment completed successfully!"
    print_status "Next steps:"
    print_status "1. Set up the database using: ./scripts/setup-database.sh"
    print_status "2. Configure environment variables in Cloud Run console if needed"
    print_status "3. Test your application at the service URL"
}

# Run main function
main "$@"