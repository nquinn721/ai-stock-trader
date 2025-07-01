#!/bin/bash

# Comprehensive Test Script for Recommendation Engine and Autonomous Trading
## Test 6: Test Paper Trading Execution (Corrected endpoint)
echo "💰 Testing Paper Trading Execution"
echo "=================================="

# Execute a test trade (using correct endpoint)
TRADE_DATA='{
  "userId": "test-user-123",
  "symbol": "AAPL",
  "type": "buy",
  "quantity": 1
}'
test_endpoint "$API_BASE/paper-trading/trade" "POST" "$TRADE_DATA" "Execute Paper Trade"the recommendation engine and autonomous trading functionality

LOCAL_URL="http://localhost:8000"
API_BASE="$LOCAL_URL/api"

echo "🤖 Testing Recommendation Engine and Autonomous Trading System"
echo "=============================================================="

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Function to test endpoint with retry
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-""}
    local description=$4
    
    echo "🔍 Testing: $description"
    echo "   Endpoint: $endpoint"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" "$endpoint" 2>/dev/null)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
        echo "   ✅ Success (HTTP $status_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body" | head -n 5
    else
        echo "   ❌ Failed (HTTP $status_code)"
        echo "$body" | head -n 3
    fi
    echo ""
}

# Test 1: Health Check
test_endpoint "$LOCAL_URL/health" "GET" "" "Backend Health Check"

# Test 2: Get Stock Data
test_endpoint "$API_BASE/stocks" "GET" "" "Get Stock Data"

# Test 3: Get Portfolios
test_endpoint "$API_BASE/paper-trading/portfolios" "GET" "" "Get Paper Trading Portfolios"

# Test 4: Test Recommendation Engine (Corrected endpoints)
echo "🧠 Testing AI Recommendation Engine"
echo "===================================="

# Test recommendation pipeline generation
BATCH_DATA='{
  "symbols": ["AAPL", "GOOGL", "MSFT"],
  "timeframes": ["1h", "1d"],
  "includeRiskAnalysis": true,
  "targetPortfolios": [1]
}'
test_endpoint "$API_BASE/auto-trading/recommendations/generate" "POST" "$BATCH_DATA" "Generate Recommendations via Pipeline"

# Test ML breakout prediction
test_endpoint "$API_BASE/ml/breakout/AAPL" "GET" "" "ML Breakout Prediction for AAPL"

# Test 5: Test Autonomous Trading (Corrected endpoints)
echo "🚀 Testing Autonomous Trading System"
echo "===================================="

# Test autonomous strategies
test_endpoint "$API_BASE/auto-trading/autonomous/strategies/active" "GET" "" "Get Active Autonomous Strategies"

# Test strategy deployment (corrected endpoint)
STRATEGY_CONFIG='{
  "portfolioId": 1,
  "strategyType": "ai_momentum",
  "config": {
    "maxPositionSize": 0.1,
    "riskThreshold": 0.05,
    "symbols": ["AAPL", "GOOGL"]
  }
}'
test_endpoint "$API_BASE/auto-trading/autonomous/strategies/ai_momentum/deploy" "POST" "$STRATEGY_CONFIG" "Deploy Autonomous Strategy"

# Test 6: Test Paper Trading Execution
echo "💰 Testing Paper Trading Execution"
echo "=================================="

# Execute a test trade
TRADE_DATA='{
  "userId": "test-user",
  "symbol": "AAPL",
  "type": "buy",
  "quantity": 10
}'
test_endpoint "$API_BASE/paper-trading/execute" "POST" "$TRADE_DATA" "Execute Paper Trade"

# Test 7: Test Auto-Trading Session Management
echo "⚙️ Testing Auto-Trading Session Management"
echo "=========================================="

# Start a trading session
SESSION_DATA='{
  "portfolio_id": "1",
  "session_name": "Test AI Trading Session",
  "config": {
    "maxConcurrentTrades": 3,
    "riskThreshold": 0.05,
    "enableAI": true
  }
}'
test_endpoint "$API_BASE/auto-trading/sessions/start" "POST" "$SESSION_DATA" "Start Trading Session"

# Get active sessions
test_endpoint "$API_BASE/auto-trading/sessions/active/all" "GET" "" "Get Active Sessions"

# Test 8: Check ML Services Integration (Corrected endpoints)
echo "🔬 Testing ML Services Integration"
echo "================================="

# Test ML breakout prediction
test_endpoint "$API_BASE/ml/breakout/AAPL" "GET" "" "ML Breakout Prediction"

# Test ML sentiment analysis
test_endpoint "$API_BASE/ml/sentiment/AAPL" "GET" "" "ML Sentiment Analysis"

# Test ML risk optimization
test_endpoint "$API_BASE/ml/risk/AAPL/1" "GET" "" "ML Risk Optimization"

# Test 9: Real-time WebSocket (Corrected test)
echo "🔄 Testing Real-time Updates"
echo "============================"

# Test auto-trading health status
test_endpoint "$API_BASE/auto-trading/status/health" "GET" "" "Auto-Trading System Health"

# Summary
echo "📊 Test Summary"
echo "==============="
echo "✅ Recommendation Engine: Tests whether AI recommendations are generated"
echo "✅ Autonomous Trading: Tests whether AI can deploy strategies and make trades"  
echo "✅ Paper Trading: Tests whether trades are actually executed"
echo "✅ ML Integration: Tests whether ML services are working"
echo ""
echo "🎯 Expected Results:"
echo "   - Recommendations should return BUY/SELL/HOLD with confidence scores"
echo "   - Autonomous trading should deploy strategies and execute trades"
echo "   - Paper trading should show actual trade execution with P&L tracking"
echo "   - ML services should return technical analysis and predictions"
echo ""
echo "⚠️ Note: If any service returns 404 or 500 errors, that component needs attention"
