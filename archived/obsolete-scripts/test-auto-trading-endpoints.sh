#!/bin/bash

# Test Auto-Trading Endpoints
# This script tests the corrected auto-trading session endpoints

BACKEND_URL="https://stock-trading-app-backend-service-467054015715.us-central1.run.app"
API_BASE="$BACKEND_URL/api/auto-trading"

echo "Testing Auto-Trading Endpoints..."
echo "=================================="

# Test health check first
echo "1. Testing backend health..."
curl -s "$BACKEND_URL/health" | head -n 20

echo -e "\n\n2. Testing auto-trading sessions start endpoint (POST /api/auto-trading/sessions/start)..."

# Test correct endpoint with proper body
TEST_SESSION_DATA='{
  "portfolio_id": "test-portfolio-123",
  "session_name": "Test Trading Session",
  "config": {
    "maxConcurrentTrades": 3,
    "riskThreshold": 0.05
  }
}'

echo "Request body: $TEST_SESSION_DATA"
echo "Endpoint: $API_BASE/sessions/start"

curl -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_SESSION_DATA" \
  "$API_BASE/sessions/start" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -n 20

echo -e "\n\n3. Testing the old incorrect endpoint (should get 404)..."
echo "Endpoint: $API_BASE/sessions/test-portfolio-123/start"

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"session_name": "Test"}' \
  "$API_BASE/sessions/test-portfolio-123/start" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -n 20

echo -e "\n\n4. Testing get active sessions..."
curl -s "$API_BASE/sessions/active/all" -w "\nHTTP Status: %{http_code}\n" | head -n 20

echo -e "\n\nTest completed!"
