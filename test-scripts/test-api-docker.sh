#!/bin/bash

# External API Testing Script for Docker/Cloud Run Deployment
# This script validates all external API integrations work correctly in containerized environments

set -e

echo "🚀 Stock Trading App - External API Integration Testing"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE_NAME="stock-trading-app:test"
CONTAINER_NAME="stock-trading-test"
TEST_PORT="8080"
TIMEOUT=30

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

# Function to cleanup on exit
cleanup() {
    print_status "INFO" "Cleaning up test containers..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Set trap for cleanup
trap cleanup EXIT

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_status "ERROR" "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "INFO" "Docker is running"

# Check for environment file
if [ ! -f ".env.test" ]; then
    print_status "WARNING" "Creating .env.test file with placeholder values"
    cat > .env.test << EOF
# Test environment file for API integration testing
# Replace with actual API keys for comprehensive testing

ALPHA_VANTAGE_API_KEY=demo
FINNHUB_API_KEY=demo
OPENAI_API_KEY=demo
ANTHROPIC_API_KEY=demo

# Database (not required for API testing)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=test
DB_PASSWORD=test
DB_NAME=test_db

# Application
NODE_ENV=production
PORT=8080
DOCKER_ENV=true
EOF
    print_status "INFO" "Created .env.test file. Please add your API keys for full testing."
fi

# Build Docker image
print_status "INFO" "Building Docker image..."
if docker build -f Dockerfile.cloudrun -t $DOCKER_IMAGE_NAME . --quiet; then
    print_status "SUCCESS" "Docker image built successfully"
else
    print_status "ERROR" "Failed to build Docker image"
    exit 1
fi

# Run container
print_status "INFO" "Starting test container..."
if docker run -d \
    --name $CONTAINER_NAME \
    -p $TEST_PORT:8080 \
    --env-file .env.test \
    $DOCKER_IMAGE_NAME; then
    print_status "SUCCESS" "Container started successfully"
else
    print_status "ERROR" "Failed to start container"
    exit 1
fi

# Wait for container to be ready
print_status "INFO" "Waiting for application to start..."
for i in $(seq 1 $TIMEOUT); do
    if curl -s -f "http://localhost:$TEST_PORT/health" >/dev/null 2>&1; then
        print_status "SUCCESS" "Application is ready (${i}s)"
        break
    fi
    if [ $i -eq $TIMEOUT ]; then
        print_status "ERROR" "Application failed to start within ${TIMEOUT} seconds"
        print_status "INFO" "Container logs:"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    sleep 1
done

echo ""
echo "🔍 Running API Integration Tests"
echo "================================"

# Test basic health endpoint
print_status "INFO" "Testing basic health endpoint..."
HEALTH_RESPONSE=$(curl -s "http://localhost:$TEST_PORT/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    print_status "SUCCESS" "Basic health check passed"
else
    print_status "ERROR" "Basic health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test API configuration endpoint
print_status "INFO" "Testing API configuration endpoint..."
API_CONFIG_RESPONSE=$(curl -s "http://localhost:$TEST_PORT/api/health/apis" 2>/dev/null || echo "endpoint_not_found")
if [ "$API_CONFIG_RESPONSE" != "endpoint_not_found" ]; then
    if echo "$API_CONFIG_RESPONSE" | grep -q '"status"'; then
        print_status "SUCCESS" "API configuration endpoint responding"
        
        # Parse API status
        if echo "$API_CONFIG_RESPONSE" | grep -q '"status":"healthy"'; then
            print_status "SUCCESS" "All APIs are healthy"
        elif echo "$API_CONFIG_RESPONSE" | grep -q '"status":"degraded"'; then
            print_status "WARNING" "Some APIs are not configured (degraded mode)"
        else
            print_status "ERROR" "APIs are unhealthy"
        fi
        
        echo "API Status Details:"
        echo "$API_CONFIG_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$API_CONFIG_RESPONSE"
    else
        print_status "ERROR" "API configuration endpoint returned invalid response"
    fi
else
    print_status "WARNING" "API configuration endpoint not yet implemented"
fi

# Test stock data endpoint
print_status "INFO" "Testing stock data endpoint..."
STOCKS_RESPONSE=$(curl -s "http://localhost:$TEST_PORT/stocks")
if echo "$STOCKS_RESPONSE" | grep -q '\[' || echo "$STOCKS_RESPONSE" | grep -q 'symbol'; then
    print_status "SUCCESS" "Stock data endpoint responding"
else
    print_status "WARNING" "Stock data endpoint may not have data (this is expected without valid API keys)"
    echo "Response: $STOCKS_RESPONSE"
fi

# Test WebSocket endpoint availability
print_status "INFO" "Testing WebSocket endpoint availability..."
WS_TEST=$(curl -s -w "%{http_code}" "http://localhost:$TEST_PORT/socket.io/" -o /dev/null)
if [ "$WS_TEST" = "200" ] || [ "$WS_TEST" = "400" ]; then
    print_status "SUCCESS" "WebSocket endpoint is available"
else
    print_status "WARNING" "WebSocket endpoint returned HTTP $WS_TEST"
fi

# Check container logs for errors
print_status "INFO" "Checking container logs for errors..."
LOG_ERRORS=$(docker logs $CONTAINER_NAME 2>&1 | grep -i "error\|exception\|failed" | wc -l)
if [ "$LOG_ERRORS" -eq 0 ]; then
    print_status "SUCCESS" "No errors found in container logs"
else
    print_status "WARNING" "Found $LOG_ERRORS potential errors in logs"
    print_status "INFO" "Recent log entries:"
    docker logs --tail 10 $CONTAINER_NAME
fi

# Performance test
print_status "INFO" "Running basic performance test..."
PERF_START=$(date +%s%N)
for i in {1..10}; do
    curl -s "http://localhost:$TEST_PORT/health" >/dev/null
done
PERF_END=$(date +%s%N)
PERF_MS=$(( ($PERF_END - $PERF_START) / 1000000 / 10 ))
if [ $PERF_MS -lt 1000 ]; then
    print_status "SUCCESS" "Average response time: ${PERF_MS}ms"
else
    print_status "WARNING" "Slow response time: ${PERF_MS}ms (may indicate performance issues)"
fi

echo ""
echo "📊 Test Summary"
echo "==============="

# Test memory usage
MEMORY_USAGE=$(docker stats --no-stream --format "{{.MemUsage}}" $CONTAINER_NAME)
print_status "INFO" "Memory usage: $MEMORY_USAGE"

# Test CPU usage
CPU_USAGE=$(docker stats --no-stream --format "{{.CPUPerc}}" $CONTAINER_NAME)
print_status "INFO" "CPU usage: $CPU_USAGE"

echo ""
echo "🔧 Next Steps for Full API Testing"
echo "=================================="
print_status "INFO" "To test with real API keys:"
print_status "INFO" "1. Update .env.test with your actual API keys"
print_status "INFO" "2. Re-run this script: ./test-api-docker.sh"
print_status "INFO" "3. Verify all API endpoints return real data"

echo ""
echo "☁️  Cloud Run Deployment Test Commands"
echo "====================================="
print_status "INFO" "To test Cloud Run deployment:"
echo "gcloud builds submit --config cloudbuild.yaml"
echo "gcloud run services describe stock-trading-app --region=us-central1"
echo "curl https://your-cloud-run-url/health"
echo "curl https://your-cloud-run-url/api/health/apis"

echo ""
print_status "SUCCESS" "Docker API integration testing completed!"
print_status "INFO" "Container will be cleaned up automatically"
