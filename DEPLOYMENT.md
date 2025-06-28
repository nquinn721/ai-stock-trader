# Stock Trading App - CI/CD Deployment Guide

## ✅ Automatic Deployment with Google Cloud Build

Your repository is configured for **automatic deployment** to Google Cloud Run. No manual deployment scripts are needed!

## � How to Deploy

### Simple Push to Master

```bash
git add .
git commit -m "Your changes"
git push origin master
```

**That's it!** Google Cloud Build automatically:

1. Builds your Docker image using the multi-stage Dockerfile
2. Pushes to Google Container Registry
3. Deploys to Cloud Run with your database configuration
4. Sets up all environment variables and scaling settings

## 📊 Monitor Your Deployments

- **Build History**: [Google Cloud Build Console](https://console.cloud.google.com/cloud-build/builds)
- **Service Status**: [Cloud Run Console](https://console.cloud.google.com/run)
- **Application Logs**: View real-time logs in Cloud Run console

## � Current Configuration

Your `cloudbuild.yaml` is configured with:

```yaml
# Database Configuration
_DB_HOST: "10.11.33.5"
_DB_USERNAME: "accountantuser"
_DB_PASSWORD: "Accountant1234"
_DB_NAME: "stock_trading_db"

# Cloud Run Settings
- Memory: 2Gi
- CPU: 2 cores
- Timeout: 300 seconds
- Scaling: 0-10 instances
- Port: 8080
```

```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com
```

### Step 3: Setup Database

```bash
# Run the database setup script
./scripts/setup-database.sh
```

This creates:

- Cloud SQL MySQL 8.0 instance
- Database with complete schema
- Database user with secure password
- Password stored in Secret Manager
- Proper IAM permissions for Cloud Run

### Step 4: Deploy Application

```bash
# Deploy to Cloud Run
./scripts/deploy.sh
```

This will:

- Build the Docker container (backend + frontend)
- Push to Google Container Registry
- Deploy to Cloud Run with proper configuration
- Connect to the database via Cloud SQL Proxy

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  Cloud Build    │───▶│   Cloud Run     │
│                 │    │  (CI/CD)        │    │  (App Server)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                                ┌─────────────────┐
                                                │   Cloud SQL     │
                                                │   (Database)    │
                                                └─────────────────┘
```

### Container Structure

The deployment uses a single container that includes:

- **NestJS Backend** (API server on port 8080)
- **React Frontend** (served as static files by the backend)
- **Database connectivity** via Cloud SQL Proxy
- **Health checks** and proper signal handling

## 🔄 CI/CD with GitHub Actions

### Setting Up Automated Deployment

1. **Create GitHub Secrets** (found in your repo: Settings → Secrets and variables → Actions):

   ```
   GOOGLE_CLOUD_PROJECT: your-project-id
   GOOGLE_CLOUD_SA_KEY: <service-account-json-key>
   DB_CONNECTION_NAME: your-project-id:us-central1:ai-stock-trader-db
   DB_NAME: stocktrader
   DB_USERNAME: stocktrader_user
   ```

2. **Service Account Key**: The setup script creates this for you at `github-actions-key.json`

3. **Push to GitHub**: Any push to `main` or `master` branch will trigger automatic deployment

### Workflow Features

- ✅ **Automated Testing**: Runs all backend and frontend tests
- ✅ **Code Quality**: Linting and build validation
- ✅ **Secure Deployment**: Uses Google-recommended authentication
- ✅ **Zero-Downtime**: Cloud Run handles rolling updates
- ✅ **Rollback Ready**: Each deployment is tagged with commit SHA

## 🗄️ Database Management

### Automatic Schema Setup

The database setup script automatically creates:

- **Users table**: User authentication and profiles
- **Portfolios table**: Investment portfolios
- **Stocks table**: Stock symbol and company information
- **Positions table**: Current holdings in portfolios
- **Trades table**: Historical trade records
- **Orders table**: Pending and executed orders
- **Trading signals table**: AI-generated recommendations
- **News table**: Financial news with sentiment analysis
- **Auto trading rules table**: Automated trading configurations
- **Trading sessions table**: Automated trading session tracking

### Database Access

- **Connection**: Uses Cloud SQL Proxy (no external IPs needed)
- **Security**: Passwords stored in Secret Manager
- **Backup**: Automatic daily backups enabled
- **Monitoring**: Cloud SQL insights enabled
- **Scaling**: Automatic storage scaling enabled

### Manual Database Operations

```bash
# Connect to database directly
gcloud sql connect ai-stock-trader-db --user=stocktrader_user --database=stocktrader

# View logs
gcloud sql operations list --instance=ai-stock-trader-db

# Create backup
gcloud sql backups create --instance=ai-stock-trader-db
```

## 🔧 Configuration

### Environment Variables

The application automatically configures these in production:

```bash
NODE_ENV=production
PORT=8080
DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
DB_PORT=3306
DB_NAME=stocktrader
DB_USERNAME=stocktrader_user
DB_PASSWORD=<from-secret-manager>
```

### Resource Limits

Default Cloud Run configuration:

- **Memory**: 2GB
- **CPU**: 2 vCPUs
- **Concurrency**: 80 requests per instance
- **Timeout**: 300 seconds
- **Min instances**: 0 (scales to zero)
- **Max instances**: 10

### Scaling Configuration

```bash
# Update scaling settings
gcloud run services update ai-stock-trader \
    --region=us-central1 \
    --min-instances=1 \
    --max-instances=20 \
    --concurrency=100
```

## 📊 Monitoring and Logs

### View Application Logs

```bash
# Real-time logs
gcloud run logs tail ai-stock-trader --region=us-central1

# Recent logs
gcloud run logs read ai-stock-trader --region=us-central1 --limit=50
```

### Monitoring Dashboard

Access monitoring at: [Google Cloud Console - Cloud Run](https://console.cloud.google.com/run)

Available metrics:

- Request latency and count
- Error rates
- Instance count
- CPU and memory usage
- Database connections

## 🔒 Security Features

### Application Security

- ✅ **Non-root container**: Runs as non-privileged user
- ✅ **Secret management**: Passwords in Secret Manager
- ✅ **Network security**: Private database connections
- ✅ **HTTPS only**: Automatic SSL/TLS termination
- ✅ **CORS configured**: Proper frontend/backend communication

### Database Security

- ✅ **Private IP**: No external database access
- ✅ **Encrypted connections**: SSL/TLS required
- ✅ **IAM authentication**: Service account based access
- ✅ **Backup encryption**: Automatic encrypted backups
- ✅ **Deletion protection**: Prevents accidental deletion

## 🛠️ Local Development

```bash
# Start all development servers
npm run dev:start

# Individual services:
npm run dev:backend     # Backend API (port 8000)
npm run dev:frontend    # React app (port 3000)

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# Project Management: http://localhost:5000
```

## 🎯 Production Health Check

After deployment, verify your app:

```bash
# Get your service URL
gcloud run services describe stock-trading-app --region=us-central1 --format="value(status.url)"

# Health check
curl https://your-service-url.run.app/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-06-27T...",
  "environment": "production"
}
```

## 📱 Application Architecture

### Single-Service Deployment

- **Frontend**: React SPA served as static files by NestJS
- **Backend**: NestJS API handling all endpoints and static file serving
- **Database**: Connected to your existing database at `10.11.33.5`

### URL Structure

- **Frontend App**: `/*` (React SPA)
- **API Endpoints**: `/api/*`, `/stocks/*`, `/paper-trading/*`
- **WebSocket**: `/socket.io/*`
- **Health Check**: `/health`
- **API Documentation**: `/api` (Swagger UI)

## 🔒 Security Recommendations

### For Production Use:

1. **Move secrets to Google Secret Manager**:

   ```bash
   # Store database password securely
   gcloud secrets create db-password --data-file=- <<< "Accountant1234"

   # Update cloudbuild.yaml to use secrets:
   "--set-secrets", "DB_PASSWORD=db-password:latest"
   ```

2. **Enable SSL/TLS** for database connections
3. **Set up monitoring** and alerting
4. **Configure backup strategy** for your database

## 🚨 Troubleshooting

### Build Failures

Check Cloud Build logs:

```bash
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

### Runtime Issues

Check Cloud Run logs:

```bash
gcloud run services logs read stock-trading-app --region=us-central1 --limit=50
```

### Database Connectivity

Verify database configuration in `cloudbuild.yaml` substitution variables.

## 🎉 Benefits of Your CI/CD Setup

✅ **Zero-Touch Deployment**: Push to master = automatic deployment  
✅ **Consistent Builds**: Same Docker build process every time  
✅ **Rollback Ready**: Easy to revert via Cloud Run console  
✅ **Scalable**: Auto-scales based on traffic (0-10 instances)  
✅ **Cost Effective**: Pay only for actual usage  
✅ **Integrated**: Database, frontend, and backend in one service

Your deployment is fully automated - just push your code and watch it deploy! 🚀

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Container Registry Documentation](https://cloud.google.com/container-registry/docs)
