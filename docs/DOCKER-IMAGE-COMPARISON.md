# Docker Configuration for Stock Trading App

## Current Docker Setup

After cleanup, the project now uses a streamlined Docker configuration:

**Backend**: `backend/Dockerfile.prod` (node:20-slim based)
**Frontend**: `frontend/Dockerfile.prod` (node:18-alpine + nginx)  
**Cloud Run**: `Dockerfile.cloudrun` (combined deployment)

## Production Docker Image

### **Node.js Slim Production Image**

**File**: `backend/Dockerfile.prod`
**Base**: `node:20-slim`

**Pros**:

- ✅ Debian-based with better library compatibility
- ✅ Smaller than full Debian but larger than Alpine (~70MB base)
- ✅ Better support for native modules (Canvas, TensorFlow.js)
- ✅ Uses `apt-get` package manager (more reliable)
- ✅ Good balance of size vs compatibility

**Cons**:

- ❌ Larger than Alpine
- ❌ Still requires manual Python installation

**Best For**: Production deployments where reliability > size

### 2. **Ubuntu 22.04**

**File**: `Dockerfile.ubuntu`
**Base**: `ubuntu:22.04`

**Pros**:

- ✅ Maximum compatibility with AI/ML libraries
- ✅ Latest LTS Ubuntu with modern packages
- ✅ Excellent Python/scientific computing support
- ✅ Most stable for TensorFlow.js and transformers
- ✅ Best debugging capabilities

**Cons**:

- ❌ Larger image size (~200MB base)
- ❌ More attack surface
- ❌ Slower builds

**Best For**: Development, complex AI/ML workloads, when stability is critical

### 3. **TensorFlow Optimized**

**File**: `Dockerfile.tensorflow`
**Base**: `node:20-bullseye`

**Pros**:

- ✅ Optimized for TensorFlow.js workloads
- ✅ Pre-configured for AI/ML performance
- ✅ Better memory management for ML tasks
- ✅ Debian Bullseye stability

**Cons**:

- ❌ Larger build time
- ❌ More complex setup
- ❌ Overkill if not using heavy ML

**Best For**: Heavy machine learning workloads, TensorFlow.js intensive apps

### 4. **Distroless (SECURITY FOCUSED)**

**File**: `Dockerfile.distroless`
**Base**: `gcr.io/distroless/nodejs20-debian11`

**Pros**:

- ✅ Ultra-secure (no shell, minimal attack surface)
- ✅ Smallest production image
- ✅ Google-maintained
- ✅ Excellent for Cloud Run

**Cons**:

- ❌ No shell for debugging
- ❌ Limited native module support
- ❌ May not work with all AI/ML dependencies
- ❌ Harder to troubleshoot

**Best For**: High-security environments, Cloud Run, minimal dependencies

## Performance Comparison

| Image Type | Base Size | Build Time | AI/ML Support | Security  | Debugging |
| ---------- | --------- | ---------- | ------------- | --------- | --------- |
| Alpine     | ~15MB     | Fast       | Poor          | Good      | Good      |
| Node Slim  | ~70MB     | Medium     | Good          | Good      | Good      |
| Ubuntu     | ~200MB    | Slow       | Excellent     | Fair      | Excellent |
| TensorFlow | ~150MB    | Slow       | Excellent     | Good      | Good      |
| Distroless | ~50MB     | Medium     | Limited       | Excellent | Poor      |

## Recommendation for Your App

Given your dependencies (TensorFlow.js, transformers, Brain.js, ML libraries):

### **Primary Choice: Node.js Slim**

- Best balance for production
- Good AI/ML support
- Reasonable size
- Cloud Run compatible

### **Secondary Choice: Ubuntu**

- If you encounter any native module issues
- Best for development environments
- Maximum compatibility

### **For Cloud Run: Distroless**

- If your current dependencies work
- Maximum security and performance
- Smallest production footprint

## Migration Steps

## Current Usage

```bash
# Build production backend
docker build -f backend/Dockerfile.prod -t stock-app-backend .

# Build production frontend
docker build -f frontend/Dockerfile.prod -t stock-app-frontend .

# Build for Cloud Run (full app)
docker build -f Dockerfile.cloudrun -t stock-app-cloudrun .
```

## Environment Variables

The production Docker configuration includes optimizations:

- `NODE_OPTIONS="--max-old-space-size=4096"` - Memory optimization
- `TFJS_BACKEND=cpu` - Force CPU backend for consistency
- `TFJS_DISABLE_WEBGL=true` - Disable WebGL in server environment
- Production-ready health checks and security settings

The streamlined setup reduces maintenance overhead while providing production-ready containers.
