# External API Integration Testing Suite

## Overview

This testing suite ensures all external API integrations work correctly in Docker containers and Google Cloud Run deployments. Every API change should be tested using these tools before committing to ensure production deployment compatibility.

## Quick Start

### 1. Docker API Testing

Test all API integrations in a local Docker container:

```bash
# Run the complete Docker API test
npm run test:api:docker

# Or run directly
./test-scripts/test-api-docker.sh
```

### 2. Cloud Run API Testing

Test deployed APIs in Google Cloud Run:

```bash
# Run Cloud Run API test
npm run test:api:cloudrun

# Or run directly
./test-scripts/test-cloud-run-apis.sh
```

### 3. Complete API Testing

Run both Docker and Cloud Run tests:

```bash
npm run test:api:all
```

## Test Environment Setup

### API Keys Configuration

Create a `.env.test` file with your API keys:

```bash
# Financial Data APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key

# AI/ML APIs
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Application settings
NODE_ENV=production
PORT=8080
DOCKER_ENV=true
```

**Note:** The test script will create a template `.env.test` file with placeholder values if one doesn't exist.

### Prerequisites

#### For Docker Testing:

- Docker Desktop installed and running
- API keys in `.env.test` file (optional for basic testing)
- Port 8080 available

#### For Cloud Run Testing:

- Google Cloud SDK installed (`gcloud`)
- Authenticated with Google Cloud (`gcloud auth login`)
- Project configured (`gcloud config set project YOUR_PROJECT_ID`)
- Stock Trading App deployed to Cloud Run

## Test Coverage

### Docker Tests (`test-api-docker.sh`)

✅ **Container Build & Startup**

- Builds Docker image using `Dockerfile.cloudrun`
- Starts container with environment variables
- Waits for application to be ready (up to 30 seconds)

✅ **Health Check Validation**

- Tests `/health` endpoint for basic application health
- Validates JSON response format
- Confirms application is running

✅ **API Configuration Testing**

- Tests `/api/health/apis` endpoint (if implemented)
- Validates API key configuration status
- Reports which APIs are properly configured

✅ **Functional Endpoint Testing**

- Tests `/stocks` endpoint for stock data
- Tests WebSocket endpoint availability
- Validates response formats

✅ **Performance & Resource Monitoring**

- Measures average response time
- Monitors container memory and CPU usage
- Checks for errors in container logs

✅ **Error Detection**

- Scans container logs for errors and exceptions
- Reports potential issues
- Provides recent log entries for debugging

### Cloud Run Tests (`test-cloud-run-apis.sh`)

✅ **Service Discovery & Authentication**

- Validates gcloud authentication
- Discovers deployed service URL
- Confirms service is accessible

✅ **Production API Testing**

- Tests all endpoints against live Cloud Run deployment
- Validates response codes and formats
- Measures real-world performance

✅ **Configuration Validation**

- Checks environment variables configuration
- Validates secrets configuration
- Reports resource allocation (CPU/memory)

✅ **Monitoring & Logging**

- Retrieves recent logs from Cloud Logging
- Identifies errors in production logs
- Provides troubleshooting commands

✅ **Service Health Assessment**

- Comprehensive health score calculation
- Performance benchmarking
- Resource usage analysis

## Expected Test Results

### Healthy System Response

```bash
✅ Docker image built successfully
✅ Container started successfully
✅ Application is ready (8s)
✅ Basic health check passed
✅ API configuration endpoint responding
✅ All APIs are healthy
✅ Stock data endpoint responding
✅ WebSocket endpoint is available
✅ No errors found in container logs
✅ Average response time: 150ms
✅ All tests passed (4/4)
```

### Degraded System (Missing API Keys)

```bash
✅ Docker image built successfully
✅ Container started successfully
✅ Application is ready (12s)
✅ Basic health check passed
⚠️  Some APIs are not configured (degraded mode)
✅ Stock data endpoint responding
⚠️  Stock data endpoint may not have data (this is expected without valid API keys)
✅ WebSocket endpoint is available
✅ No errors found in container logs
✅ Average response time: 280ms
⚠️  Most tests passed (3/4) - check warnings above
```

## Development Workflow Integration

### After Every API Change

1. **Code Implementation**

   ```bash
   # Make your API changes
   git add .
   git commit -m "feat: update API integration"
   ```

2. **Docker Testing**

   ```bash
   # Test in Docker container
   npm run test:api:docker
   ```

3. **Fix Issues** (if any)

   ```bash
   # Address any failing tests
   # Re-run until all tests pass
   npm run test:api:docker
   ```

4. **Deploy to Staging**

   ```bash
   # Deploy to Cloud Run staging
   npm run deploy:staging
   ```

5. **Cloud Run Testing**

   ```bash
   # Test live deployment
   npm run test:api:cloudrun
   ```

6. **Production Deployment**

   ```bash
   # Deploy to production
   npm run deploy:production

   # Final verification
   npm run test:api:cloudrun
   ```

## API Health Endpoints

### `/health` - Basic Application Health

```json
{
  "status": "ok",
  "timestamp": "2025-06-30T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### `/api/health/apis` - API Configuration Status

```json
{
  "status": "healthy",
  "configured": 5,
  "total": 5,
  "details": {
    "alphaVantage": true,
    "finnhub": true,
    "openai": true,
    "anthropic": true,
    "yahooFinance": true,
    "environment": "docker",
    "warnings": []
  },
  "timestamp": "2025-06-30T12:00:00.000Z"
}
```

## Troubleshooting

### Common Issues

#### Container Fails to Start

```bash
# Check Docker build logs
docker build -f Dockerfile.cloudrun -t debug-image .

# Check container logs
docker run --rm debug-image npm run start 2>&1 | head -20
```

#### API Timeouts

```bash
# Increase timeouts in api-endpoints.config.ts
# Check external API status
curl -I https://www.alphavantage.co
curl -I https://finnhub.io/api/v1
```

#### Missing Environment Variables

```bash
# Verify .env.test file exists and has correct format
cat .env.test

# Check container environment
docker run --rm --env-file .env.test debug-image env | grep API_KEY
```

#### Cloud Run Deployment Issues

```bash
# Check service status
gcloud run services describe stock-trading-app --region=us-central1

# View recent logs
gcloud logging read "resource.type=cloud_run_revision" --limit=20
```

### Performance Issues

#### Slow Response Times

- Check external API latency
- Monitor Cloud Run CPU/memory allocation
- Review API timeout configurations
- Consider implementing response caching

#### Memory Issues

- Monitor container memory usage during tests
- Check for memory leaks in long-running processes
- Optimize API response parsing
- Implement proper garbage collection

## Integration with CI/CD

### GitHub Actions Integration (Future)

```yaml
name: API Integration Tests
on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm install

      - name: Run Docker API tests
        run: npm run test:api:docker
        env:
          ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}
          FINNHUB_API_KEY: ${{ secrets.FINNHUB_API_KEY }}

      - name: Deploy to staging
        if: success()
        run: npm run deploy:staging

      - name: Test staging deployment
        if: success()
        run: npm run test:api:cloudrun
```

## Monitoring & Alerting

### Production Monitoring Setup

Set up monitoring for API health in production:

```bash
# Create uptime check for API health endpoint
gcloud monitoring uptime-check-configs create \
  --display-name="Stock Trading App API Health" \
  --monitored-resource-type="uptime_url" \
  --hostname="your-app-url.run.app" \
  --path="/api/health/apis" \
  --check-interval=300s
```

### Alert Policies

Monitor for:

- API endpoint failures
- High response times (>5 seconds)
- External API connectivity issues
- Container restart events
- Memory/CPU threshold breaches

## Future Enhancements

### Planned Improvements

1. **Enhanced API Testing**
   - Real API response validation
   - Load testing with multiple concurrent requests
   - Chaos engineering tests (simulate API failures)

2. **Automated Monitoring**
   - Slack/email notifications for test failures
   - Automated rollback on deployment issues
   - Performance regression detection

3. **Advanced Health Checks**
   - Circuit breaker pattern implementation
   - API dependency mapping
   - Intelligent failover mechanisms

4. **Security Testing**
   - API key rotation testing
   - Security vulnerability scanning
   - Rate limiting validation

---

**Remember:** Run these tests after every API-related change to ensure Docker and Cloud Run compatibility. The goal is to catch integration issues early in development rather than in production.
