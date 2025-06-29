# ADR-010: Deployment Infrastructure Standards

## Status
Accepted

## Context

The Stock Trading App requires a comprehensive deployment strategy that supports multiple cloud platforms while ensuring reliable functionality. During deployment preparation, we discovered several architectural challenges that required temporary module disabling and infrastructure optimizations to achieve stable deployments.

## Decision

We establish comprehensive deployment infrastructure standards covering Docker configurations, module management, dependency optimization, and systematic re-enablement of disabled functionality.

## Architecture Overview

### Current Deployment State

#### Core Functional Modules (✅ Enabled)
- **StockModule**: Core stock data and Yahoo Finance API integration
- **WebsocketModule**: Real-time data streaming and client communication
- **NewsModule**: Financial news and sentiment analysis
- **TradingModule**: Basic trading operations
- **PaperTradingModule**: Virtual trading and portfolio management
- **OrderManagementModule**: Order lifecycle and execution
- **BreakoutModule**: Breakout pattern detection
- **MLModule**: Machine learning services and predictions
- **NotificationModule**: User notifications and alerts
- **MarketScannerModule**: Market screening and alerts
- **MacroIntelligenceModule**: Economic and geopolitical analysis

#### Temporarily Disabled Modules (⚠️ Commented Out)
```typescript
// Disabled in app.module.ts for deployment stability
// AutoTradingModule, // Path-to-regexp compatibility issues
// BehavioralFinanceModule, // Path-to-regexp compatibility issues  
// MultiAssetModule, // Path-to-regexp compatibility issues
// DataIntelligenceModule, // Path-to-regexp compatibility issues
// EconomicIntelligenceModule, // Path-to-regexp compatibility issues
// MarketMakingModule, // Path-to-regexp compatibility issues
```

#### Removed Dependencies
```json
// Removed from backend/package.json for deployment optimization
// "@tensorflow/tfjs": "^4.22.0", // Heavy ML dependency
// "@xenova/transformers": "^2.17.2", // Large transformer models
// "brain.js": "^2.0.0-beta.24", // Neural network library
// "ml-matrix": "^6.12.1", // Mathematical operations
// "ml-regression": "^6.3.0", // Regression algorithms
```

## Deployment Configurations

### 1. Docker Infrastructure

#### Main Dockerfile (Multi-stage Production)
- **File**: `Dockerfile`
- **Purpose**: Cloud Run optimized production deployment
- **Features**: Multi-stage build, Node.js 22 Alpine, security hardening
- **Port**: 8080 (Cloud Run standard)

#### Cloud Run Dockerfile
- **File**: `Dockerfile.cloudrun`
- **Purpose**: Google Cloud Run specific optimizations
- **Features**: Reduced dependencies, faster startup, smaller image
- **Build Time**: ~5-8 minutes
- **Image Size**: ~800MB (optimized)

#### Deployment Variants
```bash
Dockerfile.backend        # Backend-only deployment
Dockerfile.backend-test   # Backend with testing tools
Dockerfile.minimal        # Minimal feature set
Dockerfile.simple         # Basic functionality only
Dockerfile.complex        # Full feature set (for future)
```

### 2. Cloud Platform Configurations

#### Google Cloud Run
- **File**: `cloudbuild.yaml`
- **Memory**: 8Gi
- **CPU**: 4 cores
- **Timeout**: 3600s (1 hour)
- **Concurrency**: 80 requests
- **Auto-scaling**: 0-3 instances

#### Kubernetes
- **File**: `k8s-simple-deploy.yaml`
- **Replicas**: 2-10 (auto-scaling)
- **Resources**: 4Gi memory, 2 CPU cores
- **Health checks**: Liveness and readiness probes

#### Vercel
- **File**: `vercel.json`
- **Function timeout**: 60s
- **Memory**: 3008MB
- **Runtime**: Node.js 18

#### Render
- **File**: `render.yaml`
- **Plan**: Standard
- **Auto-deploy**: Git-based deployment

### 3. Database Configuration

#### Production Database
```typescript
// Cloud SQL MySQL Configuration
DATABASE_HOST=35.238.63.253
DATABASE_PORT=3306
DATABASE_USERNAME=stocktrader
DATABASE_PASSWORD=secure_trading_password_2024
DATABASE_NAME=stocktrading-mysql
```

#### Development Database
```typescript
// Local MySQL Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=admin
DATABASE_PASSWORD=password
DATABASE_NAME=stock_trading_db
```

## Systematic Re-enablement Plan

### Phase 1: Core Stability (✅ Complete)
**Target**: Stable deployment with essential functionality
**Timeline**: Completed

**Modules Enabled**:
- Core trading operations
- Real-time data streaming
- Order management
- Paper trading
- Basic ML services

**Infrastructure**:
- Docker optimizations
- Cloud Run deployment
- Database optimization
- WebSocket stability

### Phase 2: Trading Intelligence (🔄 In Progress)
**Target**: Advanced trading capabilities
**Timeline**: 2-3 weeks
**Priority**: High

**Modules to Re-enable**:
1. **AutoTradingModule**
   - Autonomous trading strategies
   - Rule-based execution
   - Backtesting capabilities
   - **Blocker**: Path-to-regexp compatibility
   - **Solution**: Update to compatible router version

2. **BehavioralFinanceModule**
   - Behavioral analysis
   - Market psychology indicators
   - Sentiment integration
   - **Blocker**: Controller routing conflicts
   - **Solution**: Namespace controller routes

**Technical Tasks**:
```typescript
// Fix path-to-regexp compatibility
npm install path-to-regexp@^6.2.1

// Update controller decorators
@Controller('api/v1/auto-trading') // Add version prefix
@Controller('api/v1/behavioral-finance')
```

### Phase 3: Multi-Asset Intelligence (📋 Planned)
**Target**: Cross-asset trading capabilities
**Timeline**: 3-4 weeks
**Priority**: Medium

**Modules to Re-enable**:
1. **MultiAssetModule**
   - Crypto trading
   - Forex integration
   - Commodities data
   - Cross-asset correlation

2. **DataIntelligenceModule**
   - Advanced analytics
   - Data pipeline orchestration
   - Feature engineering

3. **EconomicIntelligenceModule**
   - Economic indicators
   - Central bank analysis
   - Market regime detection

**Technical Requirements**:
- External API integrations
- Additional data sources
- Enhanced caching layer

### Phase 4: Advanced Market Making (🎯 Future)
**Target**: Professional trading capabilities
**Timeline**: 4-6 weeks
**Priority**: Low

**Modules to Re-enable**:
1. **MarketMakingModule**
   - Liquidity provision
   - Arbitrage detection
   - Exchange connectivity
   - **Requirements**: Exchange API keys, compliance review

## Deployment Naming Conventions

### Docker Images
```bash
# Naming Pattern: gcr.io/{PROJECT_ID}/stock-trading-app:{TAG}
gcr.io/heroic-footing-460117-k8/stock-trading-app:latest
gcr.io/heroic-footing-460117-k8/stock-trading-app:v1.0.0
gcr.io/heroic-footing-460117-k8/stock-trading-app:{BUILD_ID}
```

### Cloud Services
```bash
# Google Cloud Run
stock-trading-app          # Main service
stock-trading-app-staging  # Staging environment

# Kubernetes
stock-trading-deployment   # Main deployment
stock-trading-service     # Load balancer service
stock-trading-ingress     # External access
```

### Environment Variables
```bash
# Standard naming convention
NODE_ENV=production
TFJS_BACKEND=cpu
TFJS_DISABLE_WEBGL=true
DATABASE_HOST={HOST}
DATABASE_PORT={PORT}
DATABASE_USERNAME={USER}
DATABASE_PASSWORD={PASSWORD}
DATABASE_NAME={DATABASE}
```

## Build Scripts and Automation

### VS Code Tasks
```json
{
  "shell: Start React Dashboard",           // Port 3000
  "shell: Production: Build and Deploy",   // Full deployment
  "shell: Production: Start",              // Start containers
  "shell: Production: Stop",               // Stop containers
  "shell: Production: View Logs",          // Monitor logs
  "shell: Production: Health Check",       // Health verification
  "shell: Development: Start All"          // Dev environment
}
```

### NPM Scripts
```json
{
  "prod:deploy": "Deploy production environment",
  "prod:build": "Build Docker containers",
  "prod:start": "Start production services",
  "prod:stop": "Stop production services",
  "prod:logs": "View production logs",
  "prod:health": "Run health checks"
}
```

### Deployment Scripts
```bash
scripts/deploy-cloud-run.sh        # Google Cloud Run deployment
scripts/deploy-cloud-run.bat       # Windows version
scripts/deploy-cloud-run.ps1       # PowerShell version
scripts/test-docker-build.sh       # Test Docker builds
scripts/test-docker-images.sh      # Validate Docker images
```

## Security and Performance Standards

### Docker Security
```dockerfile
# Non-root user enforcement
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs
USER nestjs

# Minimal attack surface
FROM node:20-alpine  # Minimal base image
RUN apk add --no-cache dumb-init curl  # Essential tools only
```

### Performance Optimizations
```dockerfile
# Multi-stage builds for smaller images
FROM node:20-alpine AS build-stage
FROM node:20-alpine AS production

# Layer caching optimization
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts
```

### Health Monitoring
```dockerfile
# Comprehensive health checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
```

## Testing and Validation

### Deployment Testing
1. **Docker Build Validation**
   ```bash
   scripts/test-docker-build.sh
   ```

2. **Image Security Scanning**
   ```bash
   docker scan gcr.io/PROJECT/stock-trading-app:latest
   ```

3. **Health Check Verification**
   ```bash
   curl -f http://localhost:8080/health
   ```

4. **Performance Testing**
   ```bash
   npm run prod:health
   ```

### Rollback Procedures
```bash
# Cloud Run rollback
gcloud run services replace-traffic stock-trading-app \
  --to-revisions=PREVIOUS_REVISION=100

# Docker rollback
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Module Re-enablement Checklist

### Before Re-enabling Any Module:
- [ ] **Dependency Analysis**: Check for version conflicts
- [ ] **Router Compatibility**: Verify path-to-regexp compatibility
- [ ] **Controller Paths**: Ensure unique route patterns
- [ ] **Database Entities**: Verify entity relationships
- [ ] **Test Coverage**: Ensure >90% test coverage
- [ ] **Documentation**: Update API documentation
- [ ] **Security Review**: Check for vulnerabilities
- [ ] **Performance Impact**: Measure resource usage

### Re-enablement Process:
1. **Local Testing**
   ```bash
   # Uncomment module in app.module.ts
   # AutoTradingModule,
   
   npm run test          # Run tests
   npm run start:dev     # Start development
   ```

2. **Integration Testing**
   ```bash
   npm run test:e2e      # End-to-end tests
   npm run test:cov      # Coverage validation
   ```

3. **Deployment Testing**
   ```bash
   scripts/test-docker-build.sh    # Test build
   npm run prod:deploy             # Deploy to staging
   npm run prod:health             # Health checks
   ```

4. **Production Deployment**
   ```bash
   git tag v1.x.x                  # Version tag
   npm run prod:deploy             # Production deployment
   ```

## Consequences

### Positive Outcomes
- **Stable Deployments**: Reliable cloud deployment across platforms
- **Scalable Infrastructure**: Support for multiple deployment targets
- **Systematic Approach**: Clear path to full functionality restoration
- **Performance Optimization**: Reduced build times and image sizes
- **Security Hardening**: Non-root containers, minimal attack surface

### Trade-offs
- **Reduced Functionality**: Temporary loss of advanced features
- **Technical Debt**: Need to re-enable disabled modules systematically
- **Complexity**: Multiple Docker configurations to maintain
- **Resource Usage**: Higher memory/CPU requirements for full feature set

### Monitoring Requirements
- **Module Status**: Track which modules are enabled/disabled
- **Performance Metrics**: Monitor resource usage as modules are re-enabled
- **Error Tracking**: Watch for regressions during re-enablement
- **User Impact**: Monitor feature availability and user satisfaction

## Future Considerations

### Architecture Evolution
- **Microservices Migration**: Consider breaking large modules into services
- **Event-Driven Architecture**: Implement event sourcing for better modularity
- **API Gateway**: Central routing and authentication
- **Service Mesh**: Enhanced inter-service communication

### Technology Updates
- **Node.js Updates**: Regular runtime updates
- **Dependency Management**: Automated vulnerability scanning
- **Container Optimization**: Advanced Docker optimizations
- **Cloud-Native Features**: Leverage platform-specific optimizations

---

**Documentation**: [Deployment Infrastructure Standards](../PRODUCTION-DEPLOYMENT.md)  
**Related**: [ADR-005: API Design Standards](./005-api-design-standards.md)  
**Updated**: 2025-06-29
