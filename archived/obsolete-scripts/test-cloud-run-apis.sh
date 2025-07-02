#!/bin/bash

# Cloud Run API Testing Script
BASE_URL="https://stock-trading-app-203453576607.us-central1.run.app"

echo "🔧 Testing Cloud Run Stock Trading App APIs..."
echo "Base URL: $BASE_URL"
echo ""

# Test health endpoint
echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/health" | jq . || echo "Health endpoint failed"
echo ""

# Test portfolio endpoint  
echo "2. Testing Portfolio API..."
curl -s "$BASE_URL/api/paper-trading/portfolios" | jq . || echo "Portfolio API failed"
echo ""

# Test stocks endpoint
echo "3. Testing Stocks API..."
curl -s "$BASE_URL/api/stocks" | head -500 || echo "Stocks API failed"
echo ""

# Test notifications endpoint
echo "4. Testing Notifications API..."
curl -s "$BASE_URL/api/notifications" | jq . || echo "Notifications API failed"
echo ""

echo "✅ API testing completed!"
