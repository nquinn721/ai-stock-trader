#!/bin/bash

# Cloud Run Deployment Fix Script
# This script tests and deploys the fixed version

echo "🔧 Fixing Cloud Run Deployment Issues"
echo "====================================="

# 1. Check Cloud SQL instance status
echo "📊 Checking Cloud SQL instance..."
gcloud sql instances describe stocktrading-mysql --project=heroic-footing-460117-k8 --format="value(state)" 2>/dev/null

# 2. Verify database secrets
echo "🔐 Verifying database secrets..."
echo "Database Host: $(gcloud secrets versions access latest --secret=database-host --project=heroic-footing-460117-k8 2>/dev/null)"
echo "Database Name: $(gcloud secrets versions access latest --secret=database-name --project=heroic-footing-460117-k8 2>/dev/null)"
echo "Database Username: $(gcloud secrets versions access latest --secret=database-username --project=heroic-footing-460117-k8 2>/dev/null)"

# 3. Test build locally first
echo "🏗️ Testing local build..."
cd "$(dirname "$0")"

# Test Docker build
echo "Building Docker image..."
docker build -t stock-trading-app:test -f Dockerfile . 2>&1 | tail -10

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful"
    
    # 4. Deploy to Cloud Run
    echo "🚀 Deploying to Cloud Run..."
    gcloud builds submit --config=cloudbuild.yaml --project=heroic-footing-460117-k8
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🌐 Testing health endpoint..."
        
        # Get Cloud Run service URL
        SERVICE_URL=$(gcloud run services describe stock-trading-app --region=us-central1 --project=heroic-footing-460117-k8 --format="value(status.url)" 2>/dev/null)
        
        if [ ! -z "$SERVICE_URL" ]; then
            echo "Health check URL: $SERVICE_URL/health"
            curl -f "$SERVICE_URL/health" || echo "❌ Health check failed"
        fi
    else
        echo "❌ Deployment failed"
        echo "📋 Checking recent build logs..."
        gcloud builds list --limit=1 --format="value(id)" | xargs gcloud builds log
    fi
else
    echo "❌ Docker build failed"
    exit 1
fi
