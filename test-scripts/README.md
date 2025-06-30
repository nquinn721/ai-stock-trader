# Test Scripts

This directory contains standalone test scripts used for development and debugging purposes.

## Scripts Overview

### Docker & Cloud Run API Testing (NEW) 🚀

- `test-api-docker.sh` - Comprehensive Docker container API testing
- `test-cloud-run-apis.sh` - Cloud Run deployment API testing
- `README-API-TESTING.md` - Complete API testing documentation

**Quick Start:**

```bash
# Test APIs in Docker container
npm run test:api:docker

# Test APIs in Cloud Run deployment
npm run test:api:cloudrun

# Run both tests
npm run test:api:all
```

### Stock Data & API Testing

- `test-stocks-endpoint.js` - Tests the stocks API endpoint functionality
- `test-real-data-pipeline.js` - Tests the real-time data pipeline integration

### Trading Signal Testing

- `test-signal-distribution.js` - Tests trading signal distribution logic
- `test-signal-distribution-v2.js` - Updated version of signal distribution tests
- `test-signal-diversity.js` - Tests signal diversity algorithms

### Recommendation System Testing

- `test-recommendation-fix.js` - Tests for recommendation system fixes
- `test-recommendation-integration.js` - Integration tests for recommendation features

### Chart Enhancement Testing

- `test-chart-enhancements.js` - Tests for chart functionality improvements

### WebSocket & Live Data Testing

- `test-live-market-data.js` - Tests WebSocket live market data implementation
- `test-autonomous-dashboard.js` - Tests autonomous trading dashboard functionality
- `test-autonomous-trading-implementation.js` - Tests autonomous trading system implementation

### Strategy & Trading Testing

- `test-auto-trading-apis.js` - Tests auto-trading API endpoints
- `test-strategy-builder-api.js` - Tests strategy builder API functionality

## Usage

### Docker & Cloud Run Testing (Recommended)

Use the new API testing scripts for comprehensive deployment validation:

```bash
# Test all external API integrations in Docker
./test-scripts/test-api-docker.sh

# Test deployed APIs in Google Cloud Run
./test-scripts/test-cloud-run-apis.sh
```

### Traditional Node.js Testing

These scripts are typically run directly with Node.js for debugging and development purposes:

```bash
# Example usage - run from project root
node test-scripts/test-stocks-endpoint.js

# Or run from within test-scripts directory
cd test-scripts
node test-live-market-data.js
```

## ⚠️ Critical: Docker & Cloud Run Testing

**Every API change must be tested with Docker and Cloud Run compatibility:**

1. **After modifying any external API integration**
2. **Before committing API-related changes**
3. **Before deploying to production**
4. **During development when adding new APIs**

See the complete [API Testing Documentation](README-API-TESTING.md) for detailed workflows.

**Important:** When running test scripts that require external dependencies (like `node-fetch` or `socket.io-client`), ensure these are installed in the project root:

```bash
# Install required dependencies for test scripts
npm install node-fetch@2 socket.io-client --save-dev
```

**Note:** Always check the `test-scripts/` directory for available test files when debugging specific functionality.

## Note

These are development/debugging scripts and are not part of the main test suite. For the main test suite, use:

- `npm test` in the frontend directory
- `npm run test` in the backend directory
- `npm run test:e2e` for end-to-end tests
