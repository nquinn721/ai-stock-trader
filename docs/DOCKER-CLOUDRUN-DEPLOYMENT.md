# Docker & Cloud Run Deployment Guide

## Overview

This document explains the Docker setup and Cloud Run deployment process for the Stock Trading App.

## Docker Configuration

### 1. Main Dockerfile (`Dockerfile`)

- **Purpose**: Primary multi-stage build for Cloud Run deployment
- **Stages**:
  - `frontend-build`: Builds React frontend
  - `backend-build`: Builds NestJS backend
  - `production`: Final runtime image
- **Port**: 8080 (Cloud Run standard)
- **Node Version**: 20-alpine (consistent across stages)

### 2. Cloud Run Dockerfile (`Dockerfile.cloudrun`)

- **Purpose**: Simplified build specifically optimized for Cloud Run
- **Features**: Reduced dependencies, faster build times
- **Use Case**: Alternative deployment option

### 3. Backend Dockerfile (`backend/Dockerfile.prod`)

- **Purpose**: Backend-only production build
- **Port**: 8000 (backend development standard)
- **Use Case**: Microservice deployment or development

## Key Fixes Applied

### Build Dependencies

- ✅ Consistent Node.js 20-alpine across all stages
- ✅ Proper Python 3 setup for native module compilation
- ✅ Essential build tools: `make`, `g++`, `gcc`, `pkgconfig`
- ✅ Graphics libraries: `cairo-dev`, `pango-dev`, `jpeg-dev`

### Environment Variables

- ✅ `TFJS_BACKEND=cpu` - Disable GPU for TensorFlow.js
- ✅ `TFJS_DISABLE_WEBGL=true` - Disable WebGL
- ✅ `NODE_ENV=production` - Production mode
- ✅ `PORT=8080` - Cloud Run standard port

### Package Installation

- ✅ Use `npm ci` with fallback to `npm install`
- ✅ `--omit=dev` for production dependencies only
- ✅ `--ignore-scripts` to skip problematic post-install scripts
- ✅ Proper error handling with fallback commands

### Security & Performance

- ✅ Non-root user (`nestjs:nodejs`)
- ✅ `dumb-init` for proper signal handling
- ✅ Health checks with appropriate timeouts
- ✅ Minimal runtime dependencies

## Cloud Build Configuration

### Cloud Build (`cloudbuild.yaml`)

```yaml
# Key improvements:
- Increased memory: 4Gi (was 2Gi)
- Optimized timeout: 900s (was 300s)
- Reduced concurrency: 80 (was 100)
- Proper build timeouts: 1800s for Docker build
- Essential environment variables only
```

### Build Steps

1. **Docker Build**: Multi-stage build using main Dockerfile
2. **Push to Registry**: Container Registry (gcr.io)
3. **Deploy to Cloud Run**: Automated deployment with optimized settings

## Deployment Scripts

### Linux/macOS (`scripts/deploy-cloud-run.sh`)

```bash
# Usage:
export GOOGLE_CLOUD_PROJECT=your-project-id
./scripts/deploy-cloud-run.sh
```

### Windows (`scripts/deploy-cloud-run.ps1`)

```powershell
# Usage:
$env:GOOGLE_CLOUD_PROJECT = "your-project-id"
.\scripts\deploy-cloud-run.ps1
```

### Test Scripts

- `scripts/test-docker-build.sh` - Test all Dockerfiles locally
- `scripts/test-docker-build.ps1` - PowerShell version

## Local Testing

### Test Docker Build

```bash
# Test all Dockerfiles
./scripts/test-docker-build.sh

# Or manually:
docker build -f Dockerfile -t stock-trading-app:test .
docker build -f Dockerfile.cloudrun -t stock-trading-app:cloudrun-test .
cd backend && docker build -f Dockerfile.prod -t stock-trading-backend:test .
```

### Run Locally

```bash
# Using main Dockerfile
docker run -p 8080:8080 stock-trading-app:test

# Check health
curl http://localhost:8080/health
```

## Cloud Run Configuration

### Service Settings

- **Memory**: 4Gi (handles ML models and large datasets)
- **CPU**: 2 vCPUs (adequate for concurrent requests)
- **Timeout**: 900s (allows for ML model loading)
- **Concurrency**: 80 (balanced for memory usage)
- **Scaling**: 0-10 instances (cost-effective auto-scaling)

### Environment Variables

```bash
NODE_ENV=production
PORT=8080
TFJS_BACKEND=cpu
TFJS_DISABLE_WEBGL=true
```

## Troubleshooting

### Common Build Issues

#### 1. Native Module Compilation Errors

```bash
# Solution: Ensure Python 3 and build tools are installed
RUN apk add --no-cache python3 py3-setuptools make g++ gcc
RUN ln -sf python3 /usr/bin/python
```

#### 2. Canvas/Graphics Library Errors

```bash
# Solution: Install graphics dependencies
RUN apk add --no-cache cairo-dev pango-dev jpeg-dev giflib-dev
```

#### 3. TensorFlow.js GPU Errors

```bash
# Solution: Disable GPU acceleration
ENV TFJS_BACKEND=cpu
ENV TFJS_DISABLE_WEBGL=true
```

#### 4. Out of Memory During Build

```bash
# Solution: Increase Cloud Build machine type
options:
  machineType: "E2_HIGHCPU_8"
  diskSizeGb: "100"
```

### Runtime Issues

#### 1. Port Binding Errors

- Ensure `PORT=8080` environment variable
- Cloud Run automatically sets PORT, make sure app listens on `process.env.PORT`

#### 2. Health Check Failures

- Verify `/health` endpoint exists and responds quickly
- Check application startup time vs health check start period

#### 3. Permission Errors

- Ensure non-root user has proper file permissions
- Check `chown -R nestjs:nodejs /app` is executed

## Monitoring & Logs

### View Deployment Status

```bash
gcloud run services describe stock-trading-app --region=us-central1
```

### Check Logs

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=stock-trading-app" --limit=50
```

### Monitor Performance

- Cloud Run Console: https://console.cloud.google.com/run
- Check CPU/Memory usage
- Monitor request latency and error rates

## Best Practices

### Docker

1. Use specific Node.js versions (avoid `latest`)
2. Minimize layer count and image size
3. Use `.dockerignore` to exclude unnecessary files
4. Run as non-root user for security
5. Use multi-stage builds for smaller production images

### Cloud Run

1. Set appropriate memory/CPU based on workload
2. Use health checks for reliability
3. Configure proper timeouts for startup and requests
4. Enable authentication if needed
5. Use Cloud SQL Proxy for database connections

### Development

1. Test Docker builds locally before deploying
2. Use consistent environment variables across environments
3. Monitor build times and optimize Dockerfiles
4. Keep dependencies up to date
5. Document any custom configuration
