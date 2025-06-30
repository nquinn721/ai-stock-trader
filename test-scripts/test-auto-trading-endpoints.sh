#!/bin/bash

# Test Auto-Trading Endpoints After Deployment
# Usage: ./test-auto-trading-endpoints.sh <cloud-run-url>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <cloud-run-url>"
    echo "Example: $0 https://stock-trading-app-xyz.run.app"
    exit 1
fi

BASE_URL="$1"
echo "🧪 Testing auto-trading endpoints for: $BASE_URL"

# Test 1: Health Check
echo ""
echo "1️⃣ Testing health endpoint..."
curl -f "$BASE_URL/health" && echo "✅ Health check passed" || echo "❌ Health check failed"

# Test 2: General API Health
echo ""
echo "2️⃣ Testing general API..."
curl -f "$BASE_URL/api/stocks" | head -c 100 && echo "... ✅ Stocks API working" || echo "❌ Stocks API failed"

# Test 3: Auto-trading base endpoint
echo ""
echo "3️⃣ Testing auto-trading base endpoint..."
curl -f "$BASE_URL/api/auto-trading/health" && echo "✅ Auto-trading health check passed" || echo "❌ Auto-trading health check failed"

# Test 4: Active sessions endpoint (should work)
echo ""
echo "4️⃣ Testing active sessions endpoint..."
curl -f "$BASE_URL/api/auto-trading/sessions/active/all" && echo "✅ Active sessions endpoint working" || echo "❌ Active sessions endpoint failed"

# Test 5: Portfolio endpoint (should work for database test)
echo ""
echo "5️⃣ Testing portfolios endpoint..."
curl -f "$BASE_URL/api/portfolios" | head -c 100 && echo "... ✅ Portfolios API working" || echo "❌ Portfolios API failed"

# Test 6: Database connection test (using paper-trading endpoint)
echo ""
echo "6️⃣ Testing database connectivity via paper-trading..."
curl -f "$BASE_URL/api/paper-trading/portfolios" | head -c 100 && echo "... ✅ Database connection working" || echo "❌ Database connection failed"

echo ""
echo "🏁 Auto-trading endpoint testing complete!"
echo "Note: To test session creation, you'll need a valid portfolio ID and session data."
