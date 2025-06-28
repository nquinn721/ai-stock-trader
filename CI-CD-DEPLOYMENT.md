# CI/CD Deployment with Google Cloud Build

## ✅ Automatic Deployment Setup

Since Google Cloud Build is connected to your repository, deployments happen automatically when you push to the master branch. The `cloudbuild.yaml` file defines the entire build and deployment pipeline.

## 🚀 Deployment Workflow

### Automatic (Recommended)

```bash
# 1. Make your changes
git add .
git commit -m "Your commit message"

# 2. Push to master - triggers automatic deployment
git push origin master
```

### Manual (If needed for testing)

```bash
# Trigger manual build from CLI
gcloud builds submit --config cloudbuild.yaml
```

## 📋 Configuration Overview

The `cloudbuild.yaml` handles:

1. **Docker Build** - Creates optimized production image
2. **Container Push** - Pushes to Google Container Registry
3. **Cloud Run Deploy** - Deploys with database configuration
4. **Environment Setup** - Configures all production variables

## 🔧 Database Configuration

Your current database setup in `cloudbuild.yaml`:

```yaml
substitutions:
  _DB_HOST: "10.11.33.5"
  _DB_USERNAME: "accountantuser"
  _DB_PASSWORD: "Accountant1234"
  _DB_NAME: "stock_trading_db"
  _DB_SSL: "true"
```

## 🛡️ Security Recommendations

For production, consider using Google Secret Manager:

### 1. Store secrets securely:

```bash
# Store database password
gcloud secrets create db-password --data-file=- <<< "Accountant1234"

# Store other sensitive data
gcloud secrets create jwt-secret --data-file=- <<< "your-jwt-secret"
```

### 2. Update cloudbuild.yaml to use secrets:

```yaml
# Replace password substitution with secret
"--set-secrets",
"DB_PASSWORD=db-password:latest",
```

## 📊 Monitoring Deployments

### View Build History

```bash
gcloud builds list --limit=10
```

### Check Current Service

```bash
gcloud run services describe stock-trading-app --region=us-central1
```

### View Logs

```bash
gcloud run services logs read stock-trading-app --region=us-central1
```

## 🎯 Benefits of CI/CD Setup

✅ **Automatic Deployments**: Push to master = automatic deployment  
✅ **Consistent Builds**: Same build process every time  
✅ **Rollback Capability**: Easy to revert to previous versions  
✅ **Environment Consistency**: Production matches your configuration  
✅ **No Manual Steps**: Eliminates human error in deployment

## 🔄 Development Workflow

1. **Develop Locally**: Use `npm run dev:start` for development
2. **Test Changes**: Run test suites before committing
3. **Push to Master**: Automatic deployment to Cloud Run
4. **Verify Deployment**: Check health endpoint and functionality
5. **Monitor**: Use Cloud Run console for metrics and logs

No deployment scripts needed - your CI/CD pipeline handles everything! 🎉
