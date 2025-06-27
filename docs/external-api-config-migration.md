# External API Configuration Migration

This document explains the centralized API configuration system that replaces hardcoded URLs throughout the application.

## Overview

All external API URLs and HTTP configurations have been moved to centralized config files:

### Backend Configuration

- **Location**: `backend/src/config/`
- **Main Files**:
  - `api-endpoints.config.ts` - API URLs and endpoints
  - `http-client.config.ts` - HTTP timeouts, retries, rate limits
  - `index.ts` - Export barrel

### Frontend Configuration

- **Location**: `frontend/src/config/`
- **Main Files**:
  - `api.config.ts` - Frontend API and WebSocket configuration
  - `index.ts` - Export barrel

## Migration Changes

### 1. Backend Services Updated

#### News Service (`backend/src/modules/news/news.service.ts`)

- **Before**: Hardcoded Alpha Vantage and Finnhub URLs
- **After**: Uses `buildApiUrl()` helper function
- **Timeout**: Centralized in `getHttpConfig()`

#### LLM Service (`backend/src/modules/ml/services/llm.service.ts`)

- **Before**: Hardcoded OpenAI and Anthropic URLs
- **After**: Uses `buildApiUrl()` and `getProviderBaseUrl()`
- **Timeout**: Added AbortSignal with configurable timeout

### 2. Frontend Stores Updated

#### ApiStore (`frontend/src/stores/ApiStore.ts`)

- **Before**: Hardcoded base URL and timeout
- **After**: Uses `FRONTEND_API_CONFIG` for base URL and timeout

#### StockStore (`frontend/src/stores/StockStore.ts`)

- **Before**: Hardcoded endpoint paths
- **After**: Uses `FRONTEND_API_CONFIG.backend.endpoints`

#### WebSocketStore (`frontend/src/stores/WebSocketStore.ts`)

- **Before**: Hardcoded WebSocket URL and reconnection settings
- **After**: Uses `FRONTEND_API_CONFIG` and `getWebSocketConfig()`

## Configuration Structure

### Backend API Endpoints

```typescript
// Example usage
import { buildApiUrl, getHttpConfig } from "../../config";

const url = buildApiUrl("alphaVantage", "newsSentiment", {
  tickers: symbol,
  limit: "8",
  apikey: apiKey,
});

const httpConfig = getHttpConfig("alphaVantage");
const response = await axios.get(url, { timeout: httpConfig.timeout });
```

### Frontend API Endpoints

```typescript
// Example usage
import { FRONTEND_API_CONFIG, buildFrontendApiUrl } from "../config";

const stocksUrl = FRONTEND_API_CONFIG.backend.endpoints.stocks;
const historyUrl = buildFrontendApiUrl("stockHistory", { symbol: "AAPL" });
```

## Benefits

1. **Centralized Management**: All URLs in one place
2. **Environment-Specific**: Different configs for dev/prod
3. **Type Safety**: TypeScript interfaces for all configurations
4. **Consistency**: Standardized timeout and retry logic
5. **Maintainability**: Easy to update URLs and add new APIs
6. **Testing**: Easier to mock APIs with centralized config

## Environment Variables

Updated `.env.local-prod.example` to reflect the new API keys:

```bash
# External API Keys (use your actual keys)
# Note: API URLs are now centralized in config files
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
FINNHUB_API_KEY=your_finnhub_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# LLM Configuration
LLM_PROVIDER=openai  # or 'anthropic'
LLM_MODEL=gpt-4-turbo-preview
LLM_MAX_TOKENS=1000
```

## Usage Examples

### Adding a New External API

1. **Add to backend config**:

```typescript
// In api-endpoints.config.ts
export const API_ENDPOINTS = {
  // ... existing APIs
  newApi: {
    baseUrl: "https://api.newservice.com",
    endpoints: {
      getData: "/v1/data",
      postData: "/v1/submit",
    },
  },
};
```

2. **Add HTTP config**:

```typescript
// In http-client.config.ts
export const EXTERNAL_API_CONFIG = {
  // ... existing configs
  newApi: {
    http: {
      timeout: 8000,
      retries: 2,
      retryDelay: 1000,
      maxRetryDelay: 4000,
      retryCondition: (error: any) => error?.response?.status >= 500,
    },
    rateLimits: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
    },
    cacheTtl: 300000, // 5 minutes
  },
};
```

3. **Use in service**:

```typescript
import { buildApiUrl, getHttpConfig } from "../../config";

const url = buildApiUrl("newApi", "getData", { param: "value" });
const httpConfig = getHttpConfig("newApi");
const response = await axios.get(url, { timeout: httpConfig.timeout });
```

## Validation

The configuration includes validation functions:

```typescript
// Check which APIs are properly configured
const apiStatus = validateApiConfiguration();
console.log(apiStatus);
// { alphaVantage: true, finnhub: false, openai: true, anthropic: false }
```

## Testing

When writing tests, you can easily mock the configuration:

```typescript
jest.mock("../../config", () => ({
  buildApiUrl: jest.fn(() => "http://mock-api.test"),
  getHttpConfig: jest.fn(() => ({ timeout: 5000 })),
}));
```

## Migration Checklist

- [x] Backend: Move Alpha Vantage URLs to config
- [x] Backend: Move Finnhub URLs to config
- [x] Backend: Move OpenAI URLs to config
- [x] Backend: Move Anthropic URLs to config
- [x] Frontend: Move API base URLs to config
- [x] Frontend: Move WebSocket URLs to config
- [x] Frontend: Move endpoint paths to config
- [x] Update environment variable documentation
- [x] Add configuration validation
- [x] Add usage documentation

## Next Steps

1. **Run tests** to ensure all services work with new configuration
2. **Update any hardcoded URLs** found in other services
3. **Consider adding rate limiting** using the centralized rate limit configs
4. **Add monitoring** for external API performance using the config metadata
