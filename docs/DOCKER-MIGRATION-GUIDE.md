# Quick Docker Migration Guide

## TL;DR - Immediate Action

**Switch from Alpine to Node.js Slim for better AI/ML compatibility:**

1. **Update main Cloud Run Dockerfile** (already done ✅)
2. **Test the build locally**:
   ```bash
   docker build -t stock-app-test .
   docker run -p 8080:8080 stock-app-test
   ```
3. **Deploy to Cloud Run** using existing scripts

## Why Change from Alpine?

| Issue               | Alpine                        | Node.js Slim            |
| ------------------- | ----------------------------- | ----------------------- |
| **AI/ML Libraries** | ❌ Frequent build failures    | ✅ Better compatibility |
| **Native Modules**  | ❌ glibc compatibility issues | ✅ Full glibc support   |
| **TensorFlow.js**   | ❌ May not work properly      | ✅ Optimized for TF.js  |
| **Build Time**      | ✅ Fast                       | ⚠️ Slightly slower      |
| **Image Size**      | ✅ ~50MB                      | ⚠️ ~120MB               |
| **Debugging**       | ✅ Good                       | ✅ Excellent            |

## Quick Test Commands

```bash
# Test current setup
npm run prod:build

# Build production backend
docker build -f backend/Dockerfile.prod -t stock-app-backend .
docker run -p 8001:8000 stock-app-backend

# Build production frontend
docker build -f frontend/Dockerfile.prod -t stock-app-frontend .
docker run -p 3001:80 stock-app-frontend
```

## Deployment Changes

### Cloud Run (Already Updated ✅)

Your main `Dockerfile.cloudrun` handles full deployment:

```bash
./scripts/deploy-cloud-run.sh
```

### Local Production

Use the production Docker files:

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile.prod
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile.prod
```

## Performance Optimization

The production Dockerfiles include these optimizations:

```dockerfile
# Memory optimization for AI/ML workloads
ENV NODE_OPTIONS="--max-old-space-size=3072"

# TensorFlow.js optimizations
ENV TFJS_BACKEND=cpu
ENV TFJS_DISABLE_WEBGL=true

# Build optimizations
ENV npm_config_build_from_source=false
```

## Troubleshooting

### If Build Fails

1. **Check dependencies**: Some native modules may need additional libraries
2. **Try Ubuntu**: Most compatible option
3. **Check logs**: Look for specific missing packages

### If Runtime Issues

1. **Memory**: Increase `NODE_OPTIONS` memory limit
2. **Dependencies**: Check all AI/ML packages load correctly
3. **Health Check**: Verify `/health` endpoint responds

### If Size Matters

1. **Use Distroless**: Smallest secure option
2. **Multi-stage optimization**: Remove build dependencies in final stage
3. **Remove unused packages**: Clean up package.json

## Migration Checklist

- [ ] Test local build with Node.js Slim
- [ ] Verify all AI/ML dependencies work
- [ ] Test API endpoints respond correctly
- [ ] Update docker-compose files if needed
- [ ] Deploy to Cloud Run
- [ ] Monitor performance and logs
- [ ] Remove old Alpine-based images

## Rollback Plan

If issues occur, quickly revert:

```bash
# Revert main Dockerfile
git checkout HEAD~1 -- Dockerfile

# Rebuild and deploy
docker build -t stock-app-rollback .
./scripts/deploy-cloud-run.sh
```

The changes are backward compatible, so rollback is safe.
