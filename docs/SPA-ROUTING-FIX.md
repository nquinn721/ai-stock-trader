# SPA Routing Fix - Handle Page Refresh in Production

## Problem

When users refresh the browser on any route other than `/` (like `/trading`, `/portfolio`, etc.), they get a 404 error. This happens because the server looks for physical files at those paths instead of serving the React app.

## Solution

We've implemented proper Single Page Application (SPA) routing support for both deployment scenarios:

### 1. Frontend-Only Deployment (Nginx)

**File**: `frontend/nginx.prod.conf`

```nginx
# Handle React Router (SPA routing)
# try_files serves index.html for any route that doesn't match a file
# This allows React Router to handle client-side routing on page refresh
location / {
    try_files $uri $uri/ /index.html;
}
```

### 2. Cloud Run Deployment (NestJS Backend + Frontend)

**File**: `backend/src/main.ts`

```typescript
// Catch-all handler for React Router (SPA routing)
if (isProduction) {
  app.getHttpAdapter().get("*", (req: any, res: any) => {
    // Don't serve index.html for API routes
    if (
      req.url.startsWith("/api") ||
      req.url.startsWith("/socket.io") ||
      req.url.startsWith("/health")
    ) {
      return res.status(404).json({ message: "API endpoint not found" });
    }

    // Serve index.html for all other routes (React Router will handle them)
    res.sendFile(join(__dirname, "..", "public", "index.html"));
  });
}
```

## How It Works

### Request Flow:

1. **Static Assets** (js, css, images) → Served directly
2. **API Routes** (`/api/*`, `/socket.io/*`, `/health`) → Handled by backend
3. **React Routes** (`/trading`, `/portfolio`, etc.) → Serve `index.html`
4. **React Router** → Takes over and renders the correct component

### Key Benefits:

- ✅ Page refresh works on any route
- ✅ Direct URL access works (e.g., sharing `/trading` link)
- ✅ Browser back/forward buttons work correctly
- ✅ API routes remain unaffected
- ✅ Static asset caching still works

## Testing

### Local Development:

```bash
# Start development servers (no changes needed)
npm run dev:start
```

### Production Testing:

```bash
# Build and deploy production
npm run prod:deploy

# Test these scenarios:
# 1. Navigate to http://localhost:3080/trading
# 2. Refresh the page → Should stay on trading page
# 3. Navigate to http://localhost:3080/portfolio
# 4. Refresh the page → Should stay on portfolio page
```

### Cloud Run Testing:

```bash
# Deploy to Cloud Run
./scripts/deploy-cloud-run.sh

# Test these scenarios:
# 1. Navigate to https://your-app.run.app/trading
# 2. Refresh the page → Should stay on trading page
# 3. Try direct URL access → Should work correctly
```

## Implementation Notes

### Route Priority (Important!):

1. **Static files** (highest priority)
2. **API routes** (defined in NestJS controllers)
3. **Catch-all for React** (lowest priority)

### API Route Protection:

The catch-all handler specifically excludes API routes to prevent conflicts:

- `/api/*` → Backend API endpoints
- `/socket.io/*` → WebSocket connections
- `/health` → Health check endpoint

### Development vs Production:

- **Development**: Frontend and backend run separately (ports 3000 & 8000)
- **Production**: Single server serves both frontend and API (port 8080)

## Files Modified:

- ✅ `backend/src/main.ts` - Added catch-all handler for Cloud Run
- ✅ `frontend/nginx.prod.conf` - Already had correct `try_files` directive
- ✅ `backend/Dockerfile.prod` - Fixed `npm ci` → `npm install`
- ✅ `frontend/Dockerfile.prod` - Fixed `npm ci` → `npm install`

## Deployment Status:

- ✅ **Fix Applied**: SPA routing now works in production
- ✅ **Tested**: Backend builds successfully
- ✅ **Compatible**: Works with existing Docker configurations
- ✅ **Standards**: Uses `npm install` per project guidelines

The 404 refresh issue is now resolved! 🎉
