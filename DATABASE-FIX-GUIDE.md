# Database Configuration and Deployment Fix Guide

## Current Issues Identified

1. ❌ **Cloud Build using localhost for database host** - Won't work in Cloud Run
2. ❌ **Hardcoded test credentials** - Need actual MySQL database credentials
3. ✅ **Dependency injection** - Fixed in AppModule (all required repositories available)
4. ✅ **Entity imports** - All properly imported

## Solution Steps

### Step 1: Configure Your Database Credentials

You have **3 options** for setting up your database connection:

#### Option A: Quick Test with Environment Variables (Less Secure)

1. Edit `database-config.env` and replace the placeholder values with your actual MySQL credentials:

   ```
   DATABASE_HOST=your-actual-mysql-host
   DATABASE_PORT=3306
   DATABASE_USERNAME=your-username
   DATABASE_PASSWORD=your-password
   DATABASE_NAME=your-database-name
   ```

2. Run the PowerShell script to update Cloud Build:
   ```powershell
   powershell -ExecutionPolicy Bypass -File update-cloudbuild-db.ps1
   ```

#### Option B: Secure with Google Secret Manager (Recommended)

1. Run the setup script:

   ```powershell
   powershell -ExecutionPolicy Bypass -File setup-database-secrets.ps1
   ```

2. Grant secret access to Cloud Run:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member='serviceAccount:YOUR_PROJECT_ID-compute@developer.gserviceaccount.com' \
       --role='roles/secretmanager.secretAccessor'
   ```

#### Option C: Manual Update of cloudbuild.yaml

Edit the environment variables section in `cloudbuild.yaml` directly.

### Step 2: Database Host Options

Your `DATABASE_HOST` depends on your MySQL setup:

- **Google Cloud SQL**: `your-project:region:instance-name` or private IP
- **External Service** (Railway, PlanetScale, etc.): Use provided connection string
- **Self-hosted**: Public IP address or domain

### Step 3: Deploy and Test

1. **Deploy to Cloud Run**:

   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Test the deployment**:

   ```bash
   # Test health endpoint
   curl https://your-service-url.run.app/health

   # Test database connection
   curl https://your-service-url.run.app/api/stocks
   ```

### Step 4: Verify Database Initialization

The app will automatically:

- ✅ Connect to your MySQL database
- ✅ Create all tables (with `synchronize: true`)
- ✅ Initialize the database schema
- ✅ Log connection status

### Step 5: Test Critical Endpoints

After deployment, test these key endpoints:

- `GET /health` - Health check
- `GET /api/stocks` - Stock data
- `GET /api/portfolios` - Portfolio data
- `POST /api/auto-trading/sessions` - Auto-trading session creation
- `POST /api/auto-trading/sessions/1/start` - Start trading session

## Auto-Trading Endpoint Fixes (COMPLETED ✅)

**Issue**: Frontend was getting 404 errors when trying to start auto-trading sessions.

**Root Cause**: Frontend/backend endpoint mismatch:

- Frontend was calling `/api/auto-trading/sessions/:id/start` (with portfolio ID in URL)
- Backend expects `/api/auto-trading/sessions/start` (with `portfolio_id` in request body)

**Fixes Applied**:

1. ✅ **Updated startTradingSession method** in `frontend/src/services/autoTradingService.ts`
   - Now properly includes `portfolio_id` in request body
   - Uses correct `/sessions/start` endpoint (not `/sessions/:id/start`)

2. ✅ **Fixed getActiveSessions endpoint** in `frontend/src/services/autoTradingService.ts`
   - Changed from `/sessions/active` to `/sessions/active/all` to match backend

3. ✅ **Fixed stopTradingSession parameters** in `frontend/src/services/autoTradingService.ts`
   - Changed from `{ reason }` to `{ stop_reason: reason }` to match backend DTO

4. ✅ **Updated pauseTradingSession** in `frontend/src/stores/AutoTradingStore.ts`
   - Backend doesn't have pause endpoint, using stop with "Paused by user" reason
   - Updates session status to "stopped" instead of "paused"

5. ✅ **Added auto-trading endpoints** to `frontend/src/config/api.config.ts`
   - Added proper TypeScript interface definitions
   - Centralized endpoint configuration

**Expected Results After Deployment**:

- ✅ POST `/api/auto-trading/sessions/start` should work (no more 404)
- ✅ All auto-trading session management should function properly
- ✅ Frontend and backend endpoint compatibility restored

## Summary of All Fixes Applied

### ✅ Database Configuration Fixed

- Removed SQLite fallback configuration
- Set up MySQL-only connection in `backend/src/app.module.ts`
- Fixed dependency injection for all required repositories
- Enabled `synchronize: true` for automatic table creation
- Updated `cloudbuild.yaml` with proper MySQL environment variables using Google Secret Manager

### ✅ Auto-Trading API Endpoints Fixed

- Fixed frontend/backend endpoint mismatch for session creation
- Updated `frontend/src/services/autoTradingService.ts` with correct API calls
- Corrected parameter naming (`stop_reason` vs `reason`)
- Updated active sessions endpoint path (`/sessions/active/all`)
- Added auto-trading endpoints to central API configuration

### ✅ Testing and Documentation

- Created endpoint testing scripts (PowerShell and Bash)
- Updated deployment documentation
- Provided step-by-step troubleshooting guide
- Added security best practices for credential management

## Next Steps After Deployment

1. **Test Critical Endpoints**:

   ```powershell
   # Run the endpoint test script
   .\test-scripts\test-auto-trading-endpoints.ps1 -BaseUrl "https://your-service-url.run.app"
   ```

2. **Verify Database Connection**:
   - Check Cloud Run logs for successful MySQL connection
   - Verify tables are being auto-created by TypeORM
   - Test data persistence through API calls

3. **Test Auto-Trading Functionality**:
   - Create a test portfolio via `/api/paper-trading/portfolios`
   - Start an auto-trading session via `/api/auto-trading/sessions/start`
   - Monitor session status and performance

4. **Production Monitoring**:
   - Set up log monitoring for database errors
   - Monitor API response times and error rates
   - Implement health check alerts

## Expected Resolution

After deployment with these fixes:

- ✅ No more 500 errors due to database connection failures
- ✅ No more 404 errors on auto-trading endpoints
- ✅ All API endpoints functional and accessible
- ✅ Secure database credential management
- ✅ Automatic table initialization via TypeORM

## Database Requirements

Your MySQL database should:

- ✅ Be accessible from Google Cloud Run
- ✅ Have the correct username/password
- ✅ Allow connections from Cloud Run IPs
- ✅ Have sufficient storage and connection limits

## Security Notes

- 🔒 **Use Secret Manager** for production deployments
- 🔒 **Never commit database credentials** to git
- 🔒 **Use strong passwords** for database access
- 🔒 **Enable SSL** for database connections if possible

## What Happens After Configuration

1. **NestJS will connect** to your MySQL database on startup
2. **TypeORM will create tables** automatically (`synchronize: true`)
3. **Database initialization service** will verify the connection
4. **All API endpoints** will be available and functional
5. **No more 500 errors** due to database connection failures

## Troubleshooting

If you still get 500 errors after deployment:

1. Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision"`
2. Verify database credentials are correct
3. Ensure database allows connections from Cloud Run
4. Check database connection limits

## Next Steps After Fixing Database

1. ✅ Test all API endpoints
2. ✅ Run the full test suite
3. ✅ Update documentation
4. ✅ Monitor performance and logs
