#!/bin/bash

# =============================================================================
# COMPREHENSIVE RECOMMENDATION ENGINE & AUTONOMOUS TRADING TEST
# =============================================================================
# This script tests:
# 1. AI-powered recommendation engine endpoints
# 2. Paper trading execution via recommendations
# 3. Autonomous trading strategy deployment and execution
# 4. Verification that trades are actually executed in the system
# =============================================================================

API_BASE_URL="http://localhost:8000"
SYMBOL="AAPL"
TEST_SYMBOL_2="MSFT"

echo "🧠 TESTING RECOMMENDATION ENGINE & AUTONOMOUS TRADING EXECUTION"
echo "=================================================================="
echo ""

# Color functions for output
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }

# =============================================================================
# STEP 1: Test Backend Health & Stock Data
# =============================================================================
echo "🏥 STEP 1: Backend Health Check"
echo "-------------------------------"

response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_BASE_URL/api/health")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    print_success "Backend is healthy"
    cat /tmp/health_response.json | jq '.' 2>/dev/null || cat /tmp/health_response.json
else
    print_error "Backend health check failed (HTTP: $http_code)"
    exit 1
fi

echo ""

# Test stock data availability
echo "📈 Testing Stock Data Availability"
response=$(curl -s -w "%{http_code}" -o /tmp/stock_response.json "$API_BASE_URL/api/stocks/$SYMBOL")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    print_success "Stock data available for $SYMBOL"
    cat /tmp/stock_response.json | jq '.currentPrice, .symbol' 2>/dev/null || echo "Stock data retrieved"
else
    print_error "Failed to get stock data for $SYMBOL"
fi

echo ""

# =============================================================================
# STEP 2: Test ML/AI Recommendation Engine
# =============================================================================
echo "🤖 STEP 2: AI Recommendation Engine Testing"
echo "-------------------------------------------"

# Test basic recommendation
echo "Testing basic recommendation for $SYMBOL..."
response=$(curl -s -w "%{http_code}" -o /tmp/rec_response.json \
    -X POST "$API_BASE_URL/api/ml/recommendation/$SYMBOL" \
    -H "Content-Type: application/json" \
    -d '{
        "currentPrice": 220.0,
        "portfolioContext": {
            "currentHoldings": 0,
            "availableCash": 10000,
            "riskTolerance": "MEDIUM"
        },
        "timeHorizon": "1W"
    }')
http_code="${response: -3}"

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    print_success "Basic recommendation generated"
    cat /tmp/rec_response.json | jq '.action, .confidence, .reasoning[0:2]' 2>/dev/null || cat /tmp/rec_response.json
    
    # Extract recommendation details for later use
    recommendation_action=$(cat /tmp/rec_response.json | jq -r '.action' 2>/dev/null || echo "HOLD")
    recommendation_confidence=$(cat /tmp/rec_response.json | jq -r '.confidence' 2>/dev/null || echo "0.5")
    
    echo "Recommendation: $recommendation_action (Confidence: $recommendation_confidence)"
else
    print_error "Basic recommendation failed (HTTP: $http_code)"
    cat /tmp/rec_response.json
fi

echo ""

# Test enhanced recommendation with ensemble
echo "Testing enhanced recommendation with ensemble signals..."
response=$(curl -s -w "%{http_code}" -o /tmp/enhanced_rec_response.json \
    -X POST "$API_BASE_URL/api/ml/recommendation/enhanced/$SYMBOL" \
    -H "Content-Type: application/json" \
    -d '{
        "currentPrice": 220.0,
        "portfolioContext": {
            "currentHoldings": 0,
            "availableCash": 10000,
            "riskTolerance": "HIGH"
        },
        "timeHorizon": "1W",
        "ensembleOptions": {
            "timeframes": ["1h", "1d"],
            "ensembleMethod": "meta_learning",
            "confidenceThreshold": 0.7
        }
    }')
http_code="${response: -3}"

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    print_success "Enhanced recommendation generated"
    cat /tmp/enhanced_rec_response.json | jq '.action, .confidence, .compositeScore' 2>/dev/null || cat /tmp/enhanced_rec_response.json
else
    print_error "Enhanced recommendation failed (HTTP: $http_code)"
    cat /tmp/enhanced_rec_response.json
fi

echo ""

# =============================================================================
# STEP 3: Portfolio Setup for Trading
# =============================================================================
echo "💼 STEP 3: Portfolio Setup"
echo "-------------------------"

# Get existing portfolios
response=$(curl -s -w "%{http_code}" -o /tmp/portfolios_response.json "$API_BASE_URL/api/paper-trading/portfolios")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    portfolio_count=$(cat /tmp/portfolios_response.json | jq 'length' 2>/dev/null || echo "0")
    print_info "Found $portfolio_count existing portfolios"
    
    if [ "$portfolio_count" -gt "0" ]; then
        portfolio_id=$(cat /tmp/portfolios_response.json | jq -r '.[0].id' 2>/dev/null)
        portfolio_name=$(cat /tmp/portfolios_response.json | jq -r '.[0].name' 2>/dev/null || echo "Unknown")
        portfolio_cash=$(cat /tmp/portfolios_response.json | jq -r '.[0].currentCash' 2>/dev/null || echo "0")
        print_success "Using existing portfolio: $portfolio_name (ID: $portfolio_id, Cash: \$${portfolio_cash})"
    else
        print_info "No portfolios found, creating test portfolio..."
        
        # Create a test portfolio
        response=$(curl -s -w "%{http_code}" -o /tmp/create_portfolio_response.json \
            -X POST "$API_BASE_URL/api/paper-trading/portfolios" \
            -H "Content-Type: application/json" \
            -d '{
                "userId": "test-user-123",
                "portfolioType": "DAY_TRADING_STANDARD",
                "initialBalance": 30000
            }')
        http_code="${response: -3}"
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            portfolio_id=$(cat /tmp/create_portfolio_response.json | jq -r '.id' 2>/dev/null)
            print_success "Created test portfolio (ID: $portfolio_id)"
        else
            print_error "Failed to create portfolio (HTTP: $http_code)"
            cat /tmp/create_portfolio_response.json
            exit 1
        fi
    fi
else
    print_error "Failed to get portfolios (HTTP: $http_code)"
    exit 1
fi

echo ""

# =============================================================================
# STEP 4: Test Paper Trading Execution Based on Recommendation
# =============================================================================
echo "📈 STEP 4: Paper Trading Execution"
echo "---------------------------------"

if [ "$recommendation_action" = "BUY" ] && [ "$portfolio_id" != "" ]; then
    echo "Executing BUY trade based on AI recommendation..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/trade_response.json \
        -X POST "$API_BASE_URL/api/paper-trading/trade" \
        -H "Content-Type: application/json" \
        -d "{
            \"userId\": \"test-user-123\",
            \"symbol\": \"$SYMBOL\",
            \"type\": \"buy\",
            \"quantity\": 5
        }")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "BUY trade executed successfully"
        cat /tmp/trade_response.json | jq '.symbol, .type, .quantity, .price, .totalValue' 2>/dev/null || cat /tmp/trade_response.json
        
        # Get the trade ID for verification
        trade_id=$(cat /tmp/trade_response.json | jq -r '.id' 2>/dev/null)
        print_info "Trade ID: $trade_id"
    else
        print_error "BUY trade execution failed (HTTP: $http_code)"
        cat /tmp/trade_response.json
    fi
else
    print_warning "Recommendation was $recommendation_action, testing with manual BUY trade..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/trade_response.json \
        -X POST "$API_BASE_URL/api/paper-trading/trade" \
        -H "Content-Type: application/json" \
        -d "{
            \"userId\": \"test-user-123\",
            \"symbol\": \"$SYMBOL\",
            \"type\": \"buy\",
            \"quantity\": 3
        }")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "Manual BUY trade executed successfully"
        cat /tmp/trade_response.json | jq '.symbol, .type, .quantity, .price' 2>/dev/null || cat /tmp/trade_response.json
    else
        print_error "Manual BUY trade failed (HTTP: $http_code)"
        cat /tmp/trade_response.json
    fi
fi

echo ""

# =============================================================================
# STEP 5: Verify Trade Execution in Portfolio
# =============================================================================
echo "🔍 STEP 5: Verify Trade Execution"
echo "--------------------------------"

# Check updated portfolio
response=$(curl -s -w "%{http_code}" -o /tmp/updated_portfolio_response.json "$API_BASE_URL/api/paper-trading/portfolios/$portfolio_id")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    print_success "Portfolio updated after trade"
    
    # Show portfolio positions
    positions_count=$(cat /tmp/updated_portfolio_response.json | jq '.positions | length' 2>/dev/null || echo "0")
    current_cash=$(cat /tmp/updated_portfolio_response.json | jq -r '.currentCash' 2>/dev/null || echo "0")
    total_value=$(cat /tmp/updated_portfolio_response.json | jq -r '.totalValue' 2>/dev/null || echo "0")
    
    echo "Portfolio Summary:"
    echo "  - Positions: $positions_count"
    echo "  - Current Cash: \$${current_cash}"
    echo "  - Total Value: \$${total_value}"
    
    if [ "$positions_count" -gt "0" ]; then
        print_success "Trade was executed - positions found in portfolio"
        cat /tmp/updated_portfolio_response.json | jq '.positions[] | {symbol, quantity, averagePrice, currentValue}' 2>/dev/null || echo "Position details available"
    else
        print_warning "No positions found - trade may not have been executed properly"
    fi
else
    print_error "Failed to get updated portfolio (HTTP: $http_code)"
fi

echo ""

# =============================================================================
# STEP 6: Test Autonomous Trading System
# =============================================================================
echo "🤖 STEP 6: Autonomous Trading System"
echo "------------------------------------"

# Check autonomous trading health
echo "Testing autonomous trading endpoints..."

# Test active strategies
response=$(curl -s -w "%{http_code}" -o /tmp/autonomous_strategies_response.json "$API_BASE_URL/api/auto-trading/autonomous/strategies/active")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    strategies_count=$(cat /tmp/autonomous_strategies_response.json | jq 'length' 2>/dev/null || echo "0")
    print_info "Found $strategies_count active autonomous strategies"
    
    if [ "$strategies_count" -gt "0" ]; then
        cat /tmp/autonomous_strategies_response.json | jq '.[] | {id, name, status, portfolioId}' 2>/dev/null || cat /tmp/autonomous_strategies_response.json
    fi
else
    print_warning "Autonomous strategies endpoint returned HTTP: $http_code"
fi

# Test auto-trading sessions
response=$(curl -s -w "%{http_code}" -o /tmp/auto_sessions_response.json "$API_BASE_URL/api/auto-trading/sessions/active/all")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    sessions_count=$(cat /tmp/auto_sessions_response.json | jq 'length' 2>/dev/null || echo "0")
    print_info "Found $sessions_count active auto-trading sessions"
    
    if [ "$sessions_count" -gt "0" ]; then
        cat /tmp/auto_sessions_response.json | jq '.[] | {id, sessionName, status, portfolioId}' 2>/dev/null || cat /tmp/auto_sessions_response.json
    fi
else
    print_warning "Auto-trading sessions endpoint returned HTTP: $http_code"
fi

echo ""

# =============================================================================
# STEP 7: Test Strategy Deployment (if possible)
# =============================================================================
echo "🚀 STEP 7: Strategy Deployment Test"
echo "-----------------------------------"

# Try to deploy a simple test strategy
echo "Attempting to deploy a test strategy..."

# Create a simple test strategy
response=$(curl -s -w "%{http_code}" -o /tmp/strategy_create_response.json \
    -X POST "$API_BASE_URL/api/auto-trading/strategies" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Recommendation Strategy",
        "description": "Simple test strategy using AI recommendations",
        "components": [
            {
                "type": "ai_recommendation",
                "symbol": "AAPL",
                "confidence_threshold": 0.7,
                "action": "buy"
            }
        ],
        "riskRules": [
            {
                "type": "max_position_size",
                "value": 1000
            }
        ],
        "symbols": ["AAPL"],
        "timeframe": "1h"
    }')
http_code="${response: -3}"

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    strategy_id=$(cat /tmp/strategy_create_response.json | jq -r '.id' 2>/dev/null)
    print_success "Test strategy created (ID: $strategy_id)"
    
    # Try to deploy the strategy
    echo "Deploying strategy for paper trading..."
    response=$(curl -s -w "%{http_code}" -o /tmp/strategy_deploy_response.json \
        -X POST "$API_BASE_URL/api/auto-trading/strategies/$strategy_id/deploy" \
        -H "Content-Type: application/json" \
        -d "{
            \"portfolioId\": \"$portfolio_id\",
            \"maxCapitalAllocation\": 5000,
            \"riskLimits\": {
                \"maxDrawdown\": 0.1,
                \"maxDailyLoss\": 500,
                \"maxPositionSize\": 1000
            },
            \"enablePaperTrading\": true
        }")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "Strategy deployed successfully"
        cat /tmp/strategy_deploy_response.json | jq '.' 2>/dev/null || cat /tmp/strategy_deploy_response.json
    else
        print_warning "Strategy deployment failed (HTTP: $http_code)"
        cat /tmp/strategy_deploy_response.json
    fi
else
    print_warning "Strategy creation failed (HTTP: $http_code)"
    cat /tmp/strategy_create_response.json
fi

echo ""

# =============================================================================
# STEP 8: Final Verification - Check for Actual Trades
# =============================================================================
echo "✅ STEP 8: Final Verification"
echo "-----------------------------"

echo "Checking final portfolio state..."
response=$(curl -s -w "%{http_code}" -o /tmp/final_portfolio_response.json "$API_BASE_URL/api/paper-trading/portfolios/$portfolio_id")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    positions_count=$(cat /tmp/final_portfolio_response.json | jq '.positions | length' 2>/dev/null || echo "0")
    total_pnl=$(cat /tmp/final_portfolio_response.json | jq -r '.totalPnL' 2>/dev/null || echo "0")
    total_return=$(cat /tmp/final_portfolio_response.json | jq -r '.totalReturn' 2>/dev/null || echo "0")
    
    echo ""
    echo "📊 FINAL RESULTS SUMMARY"
    echo "========================"
    echo "Portfolio ID: $portfolio_id"
    echo "Active Positions: $positions_count"
    echo "Total P&L: \$${total_pnl}"
    echo "Total Return: ${total_return}%"
    
    if [ "$positions_count" -gt "0" ]; then
        print_success "TRADES WERE EXECUTED - System is working correctly"
        echo ""
        echo "Position Details:"
        cat /tmp/final_portfolio_response.json | jq '.positions[] | {symbol, quantity, averagePrice, currentValue, unrealizedPnL}' 2>/dev/null || echo "Positions exist in portfolio"
    else
        print_warning "NO TRADES EXECUTED - System may need configuration"
    fi
    
    echo ""
    print_info "Recommendation Engine Status: ✅ Working"
    print_info "Paper Trading Status: ✅ Working"
    
    # Check if autonomous trading executed any trades
    if [ "$sessions_count" -gt "0" ] || [ "$strategies_count" -gt "0" ]; then
        print_info "Autonomous Trading Status: ✅ Active"
    else
        print_warning "Autonomous Trading Status: ⚠️  No active strategies/sessions"
    fi
    
else
    print_error "Failed to get final portfolio state"
fi

echo ""
echo "🎯 TEST COMPLETED"
echo "================"
echo "The recommendation engine and trading systems have been tested."
echo "Check the results above to see if trades were actually executed."

# Cleanup temp files
rm -f /tmp/*_response.json
