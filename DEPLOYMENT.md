# AI Stock Trader - Google Cloud Run Deployment Guide

This guide will help you deploy the AI Stock Trader application to Google Cloud Run with automatic database provisioning and CI/CD pipeline setup.

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Google Cloud Platform Account** with billing enabled
2. **Google Cloud CLI** installed ([Installation Guide](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed ([Installation Guide](https://docs.docker.com/get-docker/))
4. **Git** installed and GitHub account (for CI/CD)
5. **Node.js 18+** installed (for local development)

## 🚀 Quick Start (Automated Setup)

The easiest way to deploy is using our automated setup script:

```bash
# Make sure you're in the project root directory
cd ai-stock-trader

# Run the complete setup script
./scripts/setup-project.sh
```

This script will:
- ✅ Set up your Google Cloud project
- ✅ Create and configure Cloud SQL database
- ✅ Deploy the application to Cloud Run
- ✅ Set up GitHub Actions for CI/CD
- ✅ Provide you with all necessary configuration

## 🛠️ Manual Setup (Step by Step)

If you prefer to set up manually or need more control:

### Step 1: Setup Environment

```bash
# Set your Google Cloud project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"
export REGION="us-central1"

# Authenticate with Google Cloud
gcloud auth login
gcloud config set project $GOOGLE_CLOUD_PROJECT
```

### Step 2: Enable Required APIs

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

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud builds log [BUILD_ID]
   
   # Test locally
   docker build -t test-build .
   ```

2. **Database Connection Issues**
   ```bash
   # Check Cloud SQL status
   gcloud sql instances describe ai-stock-trader-db
   
   # Test connection
   gcloud sql connect ai-stock-trader-db --user=stocktrader_user
   ```

3. **Service Not Starting**
   ```bash
   # Check service logs
   gcloud run logs read ai-stock-trader --region=us-central1
   
   # Check service status
   gcloud run services describe ai-stock-trader --region=us-central1
   ```

4. **GitHub Actions Failing**
   - Verify all secrets are set correctly
   - Check service account permissions
   - Review workflow logs in GitHub

### Health Checks

The application includes health endpoints:
- `GET /health` - Basic health check
- `GET /api` - Swagger documentation (indicates backend is working)
- `GET /` - Frontend (indicates static file serving is working)

## 💰 Cost Optimization

### Estimated Costs (US regions)

- **Cloud Run**: ~$0-50/month (depends on traffic)
- **Cloud SQL**: ~$7-25/month (db-f1-micro instance)
- **Storage**: ~$0.02/GB/month
- **Networking**: Minimal for normal usage

### Cost Optimization Tips

1. **Use minimum resources**: Start with smaller instance types
2. **Scale to zero**: Let Cloud Run scale down when not in use
3. **Monitor usage**: Use Cloud Monitoring to track resource usage
4. **Optimize queries**: Use database indexes effectively
5. **Enable compression**: Reduce bandwidth costs

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Manual deployment
./scripts/deploy.sh

# Or push to GitHub for automatic deployment
git push origin main
```

### Database Migrations

For schema changes:
1. Update the schema in `scripts/setup-database.sh`
2. Create migration scripts in a `migrations/` folder
3. Run migrations manually or integrate into deployment

### Backup and Recovery

```bash
# Create manual backup
gcloud sql backups create --instance=ai-stock-trader-db

# List backups
gcloud sql backups list --instance=ai-stock-trader-db

# Restore from backup
gcloud sql backups restore [BACKUP_ID] --restore-instance=ai-stock-trader-db
```

## 📞 Support

For issues related to:
- **Google Cloud**: [Google Cloud Support](https://cloud.google.com/support)
- **This application**: Create an issue in the GitHub repository
- **Documentation**: Refer to inline code comments and this guide

## 🎉 Next Steps

After successful deployment:

1. **Test the application**: Visit the deployed URL
2. **Set up monitoring alerts**: Configure Cloud Monitoring
3. **Customize the application**: Add your own features
4. **Scale as needed**: Adjust resources based on usage
5. **Implement monitoring**: Set up proper logging and metrics

Your AI Stock Trader application is now running in production on Google Cloud Run! 🚀