# Google Cloud Run Deployment Guide

This guide explains how to deploy the Stock Trading App to Google Cloud Run, where the NestJS backend serves the React frontend as static files.

## Architecture Overview

- **Single Service**: One Cloud Run service hosts both backend API and frontend static files
- **Static File Serving**: NestJS serves React build files from `/public` directory
- **SPA Routing**: Backend handles client-side routing with catch-all handler
- **Auto-scaling**: Cloud Run scales from 0 to 10 instances based on traffic

## Prerequisites

1. **Google Cloud CLI** installed and authenticated
2. **Google Cloud Project** with billing enabled
3. **Cloud Run API** and **Cloud Build API** enabled
4. **Container Registry API** enabled

```bash
# Install gcloud CLI (if not already installed)
# Visit: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Deployment Process

### Method 1: Using Cloud Build (Recommended)

1. **Set environment variables**:

   ```bash
   export GOOGLE_CLOUD_PROJECT=your-project-id
   export GOOGLE_CLOUD_REGION=us-central1  # optional, defaults to us-central1
   ```

2. **Deploy using script**:

   ```bash
   # Linux/Mac
   npm run cloud:deploy:sh

   # Windows
   npm run cloud:deploy
   ```

3. **Manual deployment**:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

### Method 2: Local Docker Build

1. **Build locally**:

   ```bash
   docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/stock-trading-app .
   ```

2. **Push to registry**:

   ```bash
   docker push gcr.io/$GOOGLE_CLOUD_PROJECT/stock-trading-app
   ```

3. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy stock-trading-app \
     --image gcr.io/$GOOGLE_CLOUD_PROJECT/stock-trading-app \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --memory 2Gi \
     --cpu 2 \
     --timeout 300 \
     --min-instances 0 \
     --max-instances 10
   ```

## Configuration Details

### Docker Configuration

The `Dockerfile` uses a multi-stage build:

1. **Frontend Build Stage**: Builds React app with `npm run build`
2. **Backend Build Stage**: Compiles TypeScript to JavaScript
3. **Production Stage**: Combines both builds in optimized runtime image

### Environment Variables

Production environment variables are set automatically:

- `NODE_ENV=production`
- `PORT=8080` (Cloud Run requirement)
- `REACT_APP_API_URL=""` (empty = use relative URLs)
- `REACT_APP_WS_URL=""` (empty = use same origin)

### Static File Serving

The NestJS backend is configured to:

1. **Serve static files** from `/public` directory (React build)
2. **Handle SPA routing** with catch-all handler for React Router
3. **Exclude API routes** from static file handling (`/api/*`, `/socket.io/*`)

### Cloud Run Optimizations

- **Non-root user** for security
- **Health checks** on `/health` endpoint
- **Signal handling** with dumb-init
- **Resource limits**: 2GB RAM, 2 CPU cores
- **Auto-scaling**: 0-10 instances based on traffic

## File Structure After Deployment

```
/app/
├── dist/              # Backend build (NestJS)
├── public/            # Frontend build (React)
│   ├── index.html
│   ├── static/
│   └── ...
├── node_modules/      # Production dependencies only
└── package.json
```

## API Endpoint Routing

- **Frontend App**: `/*` (served from `/public/index.html`)
- **API Endpoints**: `/api/*`, `/stocks/*`, `/paper-trading/*`, etc.
- **WebSocket**: `/socket.io/*`
- **Health Check**: `/health`
- **API Docs**: `/api` (Swagger UI)

## Environment Configuration

### Development

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Separate origins, CORS enabled

### Production (Cloud Run)

- Frontend: Served by backend as static files
- Backend: Same origin as frontend
- Relative URLs for API calls
- WebSocket uses same host

## Monitoring and Debugging

### View Logs

```bash
gcloud run services logs read stock-trading-app --region=us-central1
```

### Check Service Status

```bash
gcloud run services describe stock-trading-app --region=us-central1
```

### Health Check

```bash
curl https://your-service-url/health
```

### Service URL

```bash
gcloud run services describe stock-trading-app --region=us-central1 --format="value(status.url)"
```

## Security Features

- **HTTPS Only**: Cloud Run provides automatic HTTPS
- **Non-root Container**: Runs as `nestjs` user (UID 1001)
- **No Secrets in Image**: Environment variables set via Cloud Run
- **Resource Limits**: Memory and CPU limits prevent resource exhaustion
- **Health Checks**: Automatic container restart on health check failure

## Cost Optimization

- **Pay-per-use**: Only charged when serving requests
- **Scale to zero**: No cost when idle
- **Efficient image**: Multi-stage build reduces image size
- **Production dependencies**: Only necessary packages included

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Cloud Build logs: `gcloud builds list`
   - Verify all dependencies in package.json
   - Check TypeScript compilation errors

2. **Deployment Issues**:
   - Verify Cloud Run APIs are enabled
   - Check IAM permissions for Cloud Build service account
   - Ensure project billing is enabled

3. **Runtime Issues**:
   - Check Cloud Run logs for application errors
   - Verify health endpoint is responding
   - Check WebSocket connection issues

4. **Static File Issues**:
   - Verify React build is copied to `/public` directory
   - Check catch-all handler in main.ts
   - Ensure SPA routing is properly configured

### Debug Commands

```bash
# View build logs
gcloud builds list --limit=5

# Get detailed build log
gcloud builds log BUILD_ID

# Test health endpoint
curl -f https://your-service-url/health

# Check WebSocket connection
curl -I https://your-service-url/socket.io/

# View recent service logs
gcloud run services logs read stock-trading-app --limit=50
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Cloud Build succeeds without errors
- [ ] Health endpoint responds with 200
- [ ] Frontend loads and displays correctly
- [ ] API endpoints respond correctly
- [ ] WebSocket connections work
- [ ] Authentication/authorization working
- [ ] External APIs (Yahoo Finance, News) accessible
- [ ] Database connections established
- [ ] Logging and monitoring configured

## Scaling Configuration

Current configuration allows:

- **Min instances**: 0 (scales to zero when idle)
- **Max instances**: 10 (auto-scales based on traffic)
- **Concurrency**: 100 requests per instance
- **Memory**: 2GB per instance
- **CPU**: 2 cores per instance
- **Timeout**: 300 seconds (5 minutes)

Adjust these values in `cloudbuild.yaml` if needed based on your traffic patterns and performance requirements.
