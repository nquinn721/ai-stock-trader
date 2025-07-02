#!/bin/bash

# Cloud Run API Testing Script
# Tests external API integrations in Google Cloud Run environment

set -e

echo "☁️  Stock Trading App - Cloud Run API Testing"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="stock-trading-app"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    print_status "ERROR" "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_status "ERROR" "Not authenticated with gcloud. Run 'gcloud auth login' first."
    exit 1
fi

print_status "INFO" "gcloud CLI is ready"

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    print_status "ERROR" "No project set. Run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

print_status "INFO" "Using project: $CURRENT_PROJECT"

# Get service URL
print_status "INFO" "Getting Cloud Run service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format="value(status.url)" 2>/dev/null || echo "")

if [ -z "$SERVICE_URL" ]; then
    print_status "ERROR" "Service '$SERVICE_NAME' not found in region '$REGION'"
    print_status "INFO" "Available services:"
    gcloud run services list --region=$REGION --format="table(metadata.name,status.url)"
    exit 1
fi

print_status "SUCCESS" "Service URL: $SERVICE_URL"

echo ""
echo "🔍 Running Cloud Run API Tests"
echo "==============================="

# Test basic health endpoint
print_status "INFO" "Testing basic health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$SERVICE_URL/health" -o /tmp/health_response.json)
HEALTH_CODE=$(tail -c 3 <<< "$HEALTH_RESPONSE")

if [ "$HEALTH_CODE" = "200" ]; then
    print_status "SUCCESS" "Health endpoint responding (HTTP 200)"
    HEALTH_BODY=$(cat /tmp/health_response.json)
    if echo "$HEALTH_BODY" | grep -q '"status":"ok"'; then
        print_status "SUCCESS" "Health check passed"
    else
        print_status "WARNING" "Health endpoint returned unexpected response"
        echo "Response: $HEALTH_BODY"
    fi
else
    print_status "ERROR" "Health endpoint failed (HTTP $HEALTH_CODE)"
    cat /tmp/health_response.json 2>/dev/null || echo "No response body"
fi

# Test API configuration endpoint
print_status "INFO" "Testing API configuration endpoint..."
API_RESPONSE=$(curl -s -w "%{http_code}" "$SERVICE_URL/api/health/apis" -o /tmp/api_response.json 2>/dev/null || echo "000")
API_CODE=$(tail -c 3 <<< "$API_RESPONSE")

if [ "$API_CODE" = "200" ]; then
    print_status "SUCCESS" "API configuration endpoint responding"
    API_BODY=$(cat /tmp/api_response.json)
    
    # Parse API status
    if echo "$API_BODY" | grep -q '"status":"healthy"'; then
        print_status "SUCCESS" "All APIs are healthy"
    elif echo "$API_BODY" | grep -q '"status":"degraded"'; then
        print_status "WARNING" "Some APIs are not configured (degraded mode)"
    else
        print_status "ERROR" "APIs are unhealthy"
    fi
    
    echo ""
    echo "API Configuration Details:"
    echo "$API_BODY" | python3 -m json.tool 2>/dev/null || echo "$API_BODY"
    echo ""
    
elif [ "$API_CODE" = "404" ]; then
    print_status "WARNING" "API configuration endpoint not implemented yet"
else
    print_status "ERROR" "API configuration endpoint failed (HTTP $API_CODE)"
    cat /tmp/api_response.json 2>/dev/null || echo "No response body"
fi

# Test stock data endpoint
print_status "INFO" "Testing stock data endpoint..."
STOCKS_RESPONSE=$(curl -s -w "%{http_code}" "$SERVICE_URL/stocks" -o /tmp/stocks_response.json)
STOCKS_CODE=$(tail -c 3 <<< "$STOCKS_RESPONSE")

if [ "$STOCKS_CODE" = "200" ]; then
    print_status "SUCCESS" "Stock data endpoint responding"
    STOCKS_BODY=$(cat /tmp/stocks_response.json)
    
    # Check if we have actual stock data
    if echo "$STOCKS_BODY" | grep -q '"symbol"' && echo "$STOCKS_BODY" | grep -q '"currentPrice"'; then
        STOCK_COUNT=$(echo "$STOCKS_BODY" | grep -o '"symbol"' | wc -l)
        print_status "SUCCESS" "Received stock data for $STOCK_COUNT symbols"
    elif echo "$STOCKS_BODY" | grep -q '\[\]' || echo "$STOCKS_BODY" | grep -q '"stocks":\[\]'; then
        print_status "WARNING" "Stock endpoint returned empty data (check API keys)"
    else
        print_status "WARNING" "Stock endpoint returned unexpected format"
        echo "Response: $STOCKS_BODY"
    fi
else
    print_status "ERROR" "Stock data endpoint failed (HTTP $STOCKS_CODE)"
    cat /tmp/stocks_response.json 2>/dev/null || echo "No response body"
fi

# Test WebSocket endpoint
print_status "INFO" "Testing WebSocket endpoint..."
WS_RESPONSE=$(curl -s -w "%{http_code}" "$SERVICE_URL/socket.io/" -o /dev/null)
WS_CODE=$(tail -c 3 <<< "$WS_RESPONSE")

if [ "$WS_CODE" = "200" ] || [ "$WS_CODE" = "400" ]; then
    print_status "SUCCESS" "WebSocket endpoint is available"
else
    print_status "WARNING" "WebSocket endpoint returned HTTP $WS_CODE"
fi

# Test performance
print_status "INFO" "Running performance test..."
PERF_START=$(date +%s%N)
for i in {1..5}; do
    curl -s "$SERVICE_URL/health" >/dev/null
done
PERF_END=$(date +%s%N)
PERF_MS=$(( ($PERF_END - $PERF_START) / 1000000 / 5 ))

if [ $PERF_MS -lt 2000 ]; then
    print_status "SUCCESS" "Average response time: ${PERF_MS}ms"
elif [ $PERF_MS -lt 5000 ]; then
    print_status "WARNING" "Moderate response time: ${PERF_MS}ms (acceptable for Cloud Run)"
else
    print_status "ERROR" "Slow response time: ${PERF_MS}ms (investigate performance issues)"
fi

# Check service configuration
echo ""
echo "⚙️  Service Configuration"
echo "========================"

print_status "INFO" "Checking service configuration..."
SERVICE_CONFIG=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="json")

# Check environment variables
ENV_VARS=$(echo "$SERVICE_CONFIG" | jq -r '.spec.template.spec.template.spec.containers[0].env[]?.name' 2>/dev/null | head -10)
if [ -n "$ENV_VARS" ]; then
    print_status "SUCCESS" "Environment variables configured:"
    echo "$ENV_VARS" | while read -r var; do
        echo "  - $var"
    done
else
    print_status "WARNING" "No environment variables found (check API key configuration)"
fi

# Check secrets
SECRETS=$(echo "$SERVICE_CONFIG" | jq -r '.spec.template.spec.template.spec.containers[0].env[]? | select(.valueFrom.secretKeyRef) | .name' 2>/dev/null)
if [ -n "$SECRETS" ]; then
    print_status "SUCCESS" "Secrets configured:"
    echo "$SECRETS" | while read -r secret; do
        echo "  - $secret"
    done
else
    print_status "INFO" "No secrets configured (using environment variables)"
fi

# Check resource allocation
MEMORY=$(echo "$SERVICE_CONFIG" | jq -r '.spec.template.spec.template.spec.containers[0].resources.limits.memory' 2>/dev/null)
CPU=$(echo "$SERVICE_CONFIG" | jq -r '.spec.template.spec.template.spec.containers[0].resources.limits.cpu' 2>/dev/null)
print_status "INFO" "Resource allocation: CPU=$CPU, Memory=$MEMORY"

# Check recent logs
echo ""
echo "📋 Recent Logs"
echo "=============="
print_status "INFO" "Checking recent logs for errors..."

RECENT_LOGS=$(gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" \
    --limit=20 \
    --format="value(timestamp,severity,textPayload)" \
    --freshness=1h 2>/dev/null | head -10)

if [ -n "$RECENT_LOGS" ]; then
    echo "Recent log entries:"
    echo "$RECENT_LOGS"
    
    ERROR_COUNT=$(echo "$RECENT_LOGS" | grep -i "ERROR\|CRITICAL" | wc -l || echo "0")
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_status "WARNING" "Found $ERROR_COUNT error entries in recent logs"
    else
        print_status "SUCCESS" "No errors in recent logs"
    fi
else
    print_status "INFO" "No recent logs found or logging not accessible"
fi

echo ""
echo "📊 Test Summary"
echo "==============="

# Summary of tests
TESTS_PASSED=0
TESTS_TOTAL=4

[ "$HEALTH_CODE" = "200" ] && ((TESTS_PASSED++))
[ "$STOCKS_CODE" = "200" ] && ((TESTS_PASSED++))
[ "$WS_CODE" = "200" ] || [ "$WS_CODE" = "400" ] && ((TESTS_PASSED++))
[ $PERF_MS -lt 5000 ] && ((TESTS_PASSED++))

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    print_status "SUCCESS" "All tests passed ($TESTS_PASSED/$TESTS_TOTAL)"
elif [ $TESTS_PASSED -gt $((TESTS_TOTAL/2)) ]; then
    print_status "WARNING" "Most tests passed ($TESTS_PASSED/$TESTS_TOTAL) - check warnings above"
else
    print_status "ERROR" "Multiple test failures ($TESTS_PASSED/$TESTS_TOTAL) - investigate issues"
fi

echo ""
echo "🔧 Troubleshooting Commands"
echo "==========================="
print_status "INFO" "If issues found, use these commands to investigate:"
echo "# View detailed service description"
echo "gcloud run services describe $SERVICE_NAME --region=$REGION"
echo ""
echo "# View recent logs"
echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit=50 --format=\"table(timestamp,severity,textPayload)\""
echo ""
echo "# Update environment variables"
echo "gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars=\"KEY=VALUE\""
echo ""
echo "# View service metrics"
echo "gcloud monitoring metrics list --filter=\"resource.type=cloud_run_revision\""

echo ""
print_status "SUCCESS" "Cloud Run API testing completed!"

# Cleanup
rm -f /tmp/health_response.json /tmp/api_response.json /tmp/stocks_response.json
