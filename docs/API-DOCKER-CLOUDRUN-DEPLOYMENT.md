# External API Integration - Docker & Cloud Run Deployment Guide

## Overview

This document outlines the comprehensive strategy for ensuring all external API integrations work seamlessly in Docker containers and Google Cloud Run deployments. As we continue development, every change must be tested to ensure production deployment compatibility.

## Current External API Integrations

### Core APIs (Critical for App Function)

- **Yahoo Finance** - Real-time stock data, historical prices, market data
- **Alpha Vantage** - News sentiment analysis, additional market data
- **Finnhub** - Company news, market news, earnings calendar

### AI/ML APIs (Enhanced Features)

- **OpenAI** - GPT-based analysis and recommendations
- **Anthropic Claude** - Alternative AI analysis and insights

## Docker & Cloud Run Requirements

### Environment Variables Configuration

#### Required Environment Variables

```bash
# Financial Data APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key

# AI/ML APIs
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database (Cloud Run)
DB_HOST=your_cloud_sql_host
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=stock_trading_db

# Application
NODE_ENV=production
PORT=8080
```

#### Cloud Run Environment Setup

```bash
# Set environment variables for Cloud Run
gcloud run services update stock-trading-app \
  --region=us-central1 \
  --set-env-vars="ALPHA_VANTAGE_API_KEY=your_key" \
  --set-env-vars="FINNHUB_API_KEY=your_key" \
  --set-env-vars="OPENAI_API_KEY=your_key" \
  --set-env-vars="ANTHROPIC_API_KEY=your_key"
```

#### Secret Manager Integration (Recommended)

```bash
# Store secrets in Google Secret Manager
gcloud secrets create alpha-vantage-api-key --data-file=alpha-vantage-key.txt
gcloud secrets create finnhub-api-key --data-file=finnhub-key.txt
gcloud secrets create openai-api-key --data-file=openai-key.txt
gcloud secrets create anthropic-api-key --data-file=anthropic-key.txt

# Update Cloud Run to use secrets
gcloud run services update stock-trading-app \
  --region=us-central1 \
  --set-secrets="ALPHA_VANTAGE_API_KEY=alpha-vantage-api-key:latest" \
  --set-secrets="FINNHUB_API_KEY=finnhub-api-key:latest" \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest" \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest"
```

## Development Testing Workflow

### 1. Local Docker Testing (After Every API Change)

```bash
# Build Docker image
docker build -f Dockerfile.cloudrun -t stock-trading-app:local .

# Create environment file for testing
cat > docker-test.env << EOF
ALPHA_VANTAGE_API_KEY=your_test_key
FINNHUB_API_KEY=your_test_key
OPENAI_API_KEY=your_test_key
ANTHROPIC_API_KEY=your_test_key
NODE_ENV=production
PORT=8080
DB_HOST=localhost
DB_PORT=3306
EOF

# Run container locally
docker run -p 8080:8080 --env-file docker-test.env stock-trading-app:local

# Test API endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/health/apis
curl http://localhost:8080/stocks
```

### 2. API Connectivity Testing

```bash
# Test API health endpoint
curl http://localhost:8080/api/health/apis

# Expected response:
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

### 3. Cloud Run Staging Testing

```bash
# Deploy to staging
gcloud builds submit --config cloudbuild.yaml

# Test staging endpoints
curl https://your-staging-url/health
curl https://your-staging-url/api/health/apis
curl https://your-staging-url/stocks

# Load testing
for i in {1..50}; do
  curl -s https://your-staging-url/stocks > /dev/null &
done
wait
```

## Continuous Integration Testing

### GitHub Actions Workflow (Future Implementation)

```yaml
name: API Integration Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  docker-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker Image
        run: docker build -f Dockerfile.cloudrun -t test-image .

      - name: Test API Configuration
        run: |
          docker run --rm \
            -e ALPHA_VANTAGE_API_KEY=${{ secrets.ALPHA_VANTAGE_API_KEY }} \
            -e FINNHUB_API_KEY=${{ secrets.FINNHUB_API_KEY }} \
            test-image npm run test:api-config

      - name: Test API Connectivity
        run: |
          docker run -d -p 8080:8080 \
            -e ALPHA_VANTAGE_API_KEY=${{ secrets.ALPHA_VANTAGE_API_KEY }} \
            -e FINNHUB_API_KEY=${{ secrets.FINNHUB_API_KEY }} \
            --name test-container test-image

          sleep 30
          curl -f http://localhost:8080/health
          curl -f http://localhost:8080/api/health/apis

          docker stop test-container
```

## Monitoring & Alerting

### Health Check Endpoints

```typescript
// /health - Basic health check
{
  "status": "ok",
  "timestamp": "2025-06-30T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}

// /api/health/apis - API configuration status
{
  "status": "healthy", // healthy | degraded | unhealthy
  "configured": 5,
  "total": 5,
  "details": { ... },
  "connectivity": {
    "alphaVantage": { "available": true, "latency": 250 },
    "finnhub": { "available": true, "latency": 180 },
    // ...
  }
}
```

### Cloud Monitoring Setup

```bash
# Create uptime check
gcloud monitoring uptime-check-configs create \
  --display-name="Stock Trading App API Health" \
  --monitored-resource-type="uptime_url" \
  --hostname="your-app-url" \
  --path="/api/health/apis" \
  --port=443 \
  --use-ssl

# Create alerting policy
gcloud alpha monitoring policies create \
  --policy-from-file=monitoring-policy.yaml
```

## Error Handling & Resilience

### Retry Logic Implementation

```typescript
// Exponential backoff for API calls
const retryWithBackoff = async (fn: Function, maxRetries: number = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
};
```

### Circuit Breaker Pattern

```typescript
// Circuit breaker for unreliable APIs
class ApiCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  async call(fn: Function) {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= 5) {
      this.state = "open";
    }
  }
}
```

## Performance Optimization

### API Response Caching

```typescript
// Redis cache for API responses
class ApiCacheService {
  async getFromCache(key: string): Promise<any> {
    // Implementation with Redis or in-memory cache
  }

  async setCache(key: string, data: any, ttl: number): Promise<void> {
    // Cache with appropriate TTL based on data type
  }
}
```

### Timeout Configuration

```typescript
// API-specific timeouts
const API_TIMEOUTS = {
  alphaVantage: 15000, // Slower API
  finnhub: 10000, // Fast API
  openai: 30000, // AI processing
  anthropic: 30000, // AI processing
  yahooFinance: 8000, // Real-time data
};
```

## Security Considerations

### API Key Protection

1. **Never commit API keys to repository**
2. **Use environment variables or Secret Manager**
3. **Rotate API keys regularly**
4. **Monitor API usage for anomalies**
5. **Implement request signing where available**

### Network Security

```typescript
// Validate API responses
const validateApiResponse = (response: any, schema: any): boolean => {
  // JSON schema validation
  // Rate limiting checks
  // Response size limits
  return true;
};
```

## Deployment Checklist

### Pre-Deployment Testing

- [ ] All unit tests passing
- [ ] API configuration validation tests
- [ ] Docker build successful
- [ ] Local Docker container runs correctly
- [ ] All external APIs accessible from container
- [ ] Environment variables properly configured
- [ ] Health check endpoints responding
- [ ] WebSocket connections working
- [ ] Database connections established

### Cloud Run Deployment

- [ ] Environment variables set in Cloud Run
- [ ] API keys stored in Secret Manager
- [ ] Health check configured
- [ ] Monitoring and alerting setup
- [ ] Load testing completed
- [ ] Rollback plan prepared
- [ ] Documentation updated

### Post-Deployment Verification

- [ ] All API endpoints responding
- [ ] Stock data updating correctly
- [ ] WebSocket connections stable
- [ ] No errors in Cloud Run logs
- [ ] Monitoring dashboards showing green
- [ ] Performance metrics within acceptable ranges

## Troubleshooting Guide

### Common Issues

**Container fails to start:**

- Check environment variables are set
- Verify API keys are valid
- Review Docker build logs
- Check port configuration

**API timeouts:**

- Increase timeout values
- Check network connectivity
- Verify API provider status
- Implement retry logic

**High latency:**

- Enable response caching
- Optimize API call patterns
- Check Cloud Run CPU/memory allocation
- Monitor external API performance

**Authentication errors:**

- Verify API keys are correct
- Check API key permissions
- Rotate expired keys
- Monitor API usage quotas

## Future Enhancements

### Short-term (Next 2 Sprints)

- [ ] Implement comprehensive retry logic
- [ ] Add circuit breaker pattern
- [ ] Create API usage monitoring
- [ ] Enhance error logging

### Medium-term (Next 4 Sprints)

- [ ] Migrate to Secret Manager
- [ ] Implement advanced caching
- [ ] Add API load balancing
- [ ] Create failover mechanisms

### Long-term (Post MVP)

- [ ] Multi-region deployment
- [ ] Custom API gateway
- [ ] AI-powered optimization
- [ ] Real-time monitoring dashboard

---

**Note:** This guide must be updated with every API integration change. Test Docker and Cloud Run deployment with every significant modification to ensure production readiness.
