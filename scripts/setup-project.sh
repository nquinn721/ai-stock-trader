#!/bin/bash

# AI Stock Trader - Complete Project Setup Script
# This script sets up the entire project for Google Cloud Run deployment

set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="ai-stock-trader"
DATABASE_INSTANCE_NAME="${DATABASE_INSTANCE_NAME:-ai-stock-trader-db}"

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

# Show welcome message
show_welcome() {
    echo -e "${GREEN}"
    echo "============================================="
    echo "    AI Stock Trader - Cloud Setup"
    echo "============================================="
    echo -e "${NC}"
    echo "This script will help you set up your AI Stock Trader"
    echo "application on Google Cloud Platform."
    echo ""
}

# Get project ID if not set
get_project_id() {
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}Please enter your Google Cloud Project ID:${NC}"
        read -p "Project ID: " PROJECT_ID
        
        if [ -z "$PROJECT_ID" ]; then
            print_error "Project ID is required"
            exit 1
        fi
        
        export GOOGLE_CLOUD_PROJECT="$PROJECT_ID"
    fi
    
    print_status "Using project: $PROJECT_ID"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed"
        print_error "Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        print_error "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 &> /dev/null; then
        print_warning "You need to authenticate with Google Cloud"
        gcloud auth login
    fi
    
    print_success "Prerequisites check completed"
}

# Setup Google Cloud project
setup_project() {
    print_status "Setting up Google Cloud project..."
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Enable billing (user needs to do this manually)
    print_warning "Please ensure billing is enabled for your project: $PROJECT_ID"
    print_warning "Visit: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    
    echo -e "${YELLOW}Press Enter after enabling billing...${NC}"
    read -p ""
    
    print_success "Project setup completed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if [ -f "./scripts/setup-database.sh" ]; then
        ./scripts/setup-database.sh
    else
        print_error "Database setup script not found"
        exit 1
    fi
}

# Initial deployment
initial_deployment() {
    print_status "Performing initial deployment..."
    
    if [ -f "./scripts/deploy.sh" ]; then
        ./scripts/deploy.sh
    else
        print_error "Deployment script not found"
        exit 1
    fi
}

# Setup GitHub Actions secrets
setup_github_secrets() {
    print_status "Setting up GitHub Actions secrets..."
    
    echo -e "${YELLOW}To enable automated deployments, you need to set up the following GitHub secrets:${NC}"
    echo ""
    echo "1. GOOGLE_CLOUD_PROJECT: $PROJECT_ID"
    echo "2. GOOGLE_CLOUD_SA_KEY: Service account key JSON"
    echo "3. DB_CONNECTION_NAME: $PROJECT_ID:$REGION:$DATABASE_INSTANCE_NAME"
    echo "4. DB_NAME: stocktrader"
    echo "5. DB_USERNAME: stocktrader_user"
    echo ""
    
    print_status "Creating service account for GitHub Actions..."
    
    SA_NAME="github-actions-sa"
    SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Create service account if it doesn't exist
    if ! gcloud iam service-accounts describe $SA_EMAIL --quiet >/dev/null 2>&1; then
        gcloud iam service-accounts create $SA_NAME \
            --display-name="GitHub Actions Service Account" \
            --description="Service account for GitHub Actions CI/CD"
    fi
    
    # Grant necessary roles
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/run.admin"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/storage.admin"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/cloudsql.admin"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/secretmanager.admin"
    
    # Create and download key
    KEY_FILE="github-actions-key.json"
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SA_EMAIL
    
    print_success "Service account created: $SA_EMAIL"
    print_warning "Service account key saved to: $KEY_FILE"
    print_warning "Add this key content to GitHub secret: GOOGLE_CLOUD_SA_KEY"
    print_warning "Remember to delete the key file after adding to GitHub!"
}

# Show completion message
show_completion() {
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null || echo "Not deployed yet")
    
    echo -e "${GREEN}"
    echo "============================================="
    echo "    Setup Completed Successfully!"
    echo "============================================="
    echo -e "${NC}"
    echo "Your AI Stock Trader application is ready!"
    echo ""
    echo "🌐 Application URL: $SERVICE_URL"
    echo "📚 API Documentation: $SERVICE_URL/api"
    echo "🗄️ Database Instance: $DATABASE_INSTANCE_NAME"
    echo ""
    echo "Next steps:"
    echo "1. Set up GitHub secrets for automated deployment"
    echo "2. Push your code to GitHub to trigger automatic deployment"
    echo "3. Monitor your application in the Google Cloud Console"
    echo ""
    echo "Useful commands:"
    echo "• View logs: gcloud run logs tail $SERVICE_NAME --region=$REGION"
    echo "• Update deployment: ./scripts/deploy.sh"
    echo "• Check database: gcloud sql instances describe $DATABASE_INSTANCE_NAME"
    echo ""
}

# Main setup function
main() {
    show_welcome
    get_project_id
    check_prerequisites
    setup_project
    setup_database
    initial_deployment
    setup_github_secrets
    show_completion
}

# Run main function
main "$@"