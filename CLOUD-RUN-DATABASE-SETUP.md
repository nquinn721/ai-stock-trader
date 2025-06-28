# Cloud Run Database Configuration Guide

This guide explains how to configure database connections for the Stock Trading App when deployed on Google Cloud Run with Cloud SQL.

## Database Architecture

The application supports multiple database connection methods for Cloud Run:

1. **Unix Socket Connection** (Recommended)
2. **TCP Connection with SSL**
3. **Development/Local Database**

## Cloud SQL Setup

### 1. Create Cloud SQL Instance

```bash
# Create a MySQL instance
gcloud sql instances create stock-trading-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --deletion-protection

# Create database
gcloud sql databases create stocktrading \
  --instance=stock-trading-db

# Create user
gcloud sql users create stocktrader \
  --instance=stock-trading-db \
  --password=YOUR_SECURE_PASSWORD
```

### 2. Configure Cloud Run Service Account

```bash
# Grant Cloud SQL Client role to Cloud Run service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

## Connection Methods

### Method 1: Unix Socket (Recommended)

**Advantages:**

- More secure (no network traffic)
- Better performance
- Automatic authentication via service account
- No need to manage IP whitelisting

**Configuration:**

```yaml
# In cloudbuild.yaml
substitutions:
  _DB_HOST: "/cloudsql/your-project:us-central1:stock-trading-db"
  _DB_SOCKET_PATH: "/cloudsql/your-project:us-central1:stock-trading-db"
  _DB_PORT: "3306"
  _DB_USERNAME: "stocktrader"
  _DB_PASSWORD: "your-secure-password"
  _DB_NAME: "stocktrading"
```

**Cloud Run Deployment:**

```bash
gcloud run deploy stock-trading-app \
  --add-cloudsql-instances=your-project:us-central1:stock-trading-db \
  --set-env-vars="DB_HOST=/cloudsql/your-project:us-central1:stock-trading-db" \
  --set-env-vars="DB_SOCKET_PATH=/cloudsql/your-project:us-central1:stock-trading-db"
```

### Method 2: TCP Connection with SSL

**Advantages:**

- Works with any MySQL-compatible database
- Can connect from outside Cloud Run
- Standard connection method

**Requirements:**

- Cloud SQL instance must have public IP
- SSL certificates configured
- Authorized networks configured

**Configuration:**

```yaml
# In cloudbuild.yaml
substitutions:
  _DB_HOST: "10.x.x.x" # Cloud SQL private IP
  _DB_PORT: "3306"
  _DB_USERNAME: "stocktrader"
  _DB_PASSWORD: "your-secure-password"
  _DB_NAME: "stocktrading"
  _DB_SSL: "true"
```

## Environment Variables

### Required Environment Variables

| Variable      | Description                  | Example                             |
| ------------- | ---------------------------- | ----------------------------------- |
| `DB_HOST`     | Database host or socket path | `/cloudsql/project:region:instance` |
| `DB_PORT`     | Database port                | `3306`                              |
| `DB_USERNAME` | Database username            | `stocktrader`                       |
| `DB_PASSWORD` | Database password            | `secure-password`                   |
| `DB_NAME`     | Database name                | `stocktrading`                      |

### Optional Environment Variables

| Variable              | Description             | Default           |
| --------------------- | ----------------------- | ----------------- |
| `DB_SSL`              | Enable SSL connection   | `false`           |
| `DB_SOCKET_PATH`      | Unix socket path        | Same as `DB_HOST` |
| `DB_CONNECTION_LIMIT` | Max connections         | `10`              |
| `DB_TIMEOUT`          | Connection timeout (ms) | `60000`           |

## Security Best Practices

### 1. Use Secret Manager (Recommended)

Store sensitive database credentials in Google Secret Manager:

```bash
# Store database password in Secret Manager
gcloud secrets create db-password --data-file=- <<< "your-secure-password"

# Grant Cloud Run service account access to secret
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Update Cloud Run to use secrets:

```yaml
# In cloudbuild.yaml - add after other args
"--set-secrets",
"DB_PASSWORD=db-password:latest",
```

### 2. Database Security

- Use strong passwords (minimum 16 characters)
- Enable SSL/TLS encryption
- Use least-privilege database user permissions
- Enable Cloud SQL audit logging
- Restrict database access to specific IP ranges

### 3. Network Security

- Use VPC peering for private connectivity
- Enable Private IP for Cloud SQL
- Use Cloud NAT for outbound connections
- Implement VPC firewall rules

## Database Schema Setup

### 1. Initialize Database Schema

```sql
-- Create main tables
CREATE DATABASE IF NOT EXISTS stocktrading;
USE stocktrading;

-- Example tables (adjust based on your schema)
CREATE TABLE stocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  current_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE portfolios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  user_id INT,
  total_value DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
```

### 2. Migration Strategy

For production deployments, use database migrations:

```bash
# Run migrations during deployment
gcloud run jobs create migrate-db \
  --image=gcr.io/YOUR_PROJECT_ID/stock-trading-app:latest \
  --task-timeout=600 \
  --parallelism=1 \
  --task-count=1 \
  --command="npm,run,migrate"
```

## Monitoring and Troubleshooting

### 1. Database Connection Monitoring

Monitor database connections in Cloud Run:

```bash
# View Cloud Run logs
gcloud run services logs read stock-trading-app --region=us-central1

# View Cloud SQL logs
gcloud sql operations list --instance=stock-trading-db
```

### 2. Performance Monitoring

- Enable Cloud SQL Insights for query performance
- Monitor connection pool usage
- Set up alerting for database errors
- Track query execution times

### 3. Common Issues

**Connection Timeout:**

```yaml
# Increase timeout values
substitutions:
  _DB_TIMEOUT: "120000" # 2 minutes
```

**Too Many Connections:**

```yaml
# Reduce connection pool size
substitutions:
  _DB_CONNECTION_LIMIT: "5"
```

**SSL Connection Issues:**

```yaml
# Disable SSL for debugging (not recommended for production)
substitutions:
  _DB_SSL: "false"
```

## Deployment Commands

### Complete Deployment with Database

```bash
# Set environment variables
export GOOGLE_CLOUD_PROJECT=your-project-id
export DB_INSTANCE_NAME=stock-trading-db
export DB_PASSWORD=your-secure-password

# Deploy with Cloud Build
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _DB_HOST="/cloudsql/${GOOGLE_CLOUD_PROJECT}:us-central1:${DB_INSTANCE_NAME}",_DB_PASSWORD="${DB_PASSWORD}"
```

### Manual Cloud Run Deployment

```bash
# Deploy with database configuration
gcloud run deploy stock-trading-app \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/stock-trading-app:latest \
  --region us-central1 \
  --add-cloudsql-instances=$GOOGLE_CLOUD_PROJECT:us-central1:stock-trading-db \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="PORT=8080" \
  --set-env-vars="DB_HOST=/cloudsql/$GOOGLE_CLOUD_PROJECT:us-central1:stock-trading-db" \
  --set-env-vars="DB_PORT=3306" \
  --set-env-vars="DB_USERNAME=stocktrader" \
  --set-env-vars="DB_NAME=stocktrading" \
  --set-secrets="DB_PASSWORD=db-password:latest" \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300
```

## Testing Database Connection

### Local Testing

```bash
# Test with local environment
NODE_ENV=production \
DB_HOST=/cloudsql/your-project:us-central1:stock-trading-db \
DB_USERNAME=stocktrader \
DB_PASSWORD=your-password \
DB_NAME=stocktrading \
npm run start
```

### Health Check Endpoint

The application includes a health check endpoint that verifies database connectivity:

```bash
# Test database connection
curl https://your-service-url.run.app/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-06-27T..."
}
```

## Cost Optimization

### Database Sizing

- **Development**: `db-f1-micro` (1 vCPU, 0.6GB RAM)
- **Production**: `db-n1-standard-1` (1 vCPU, 3.75GB RAM)
- **High Load**: `db-n1-standard-2` or higher

### Connection Pooling

```javascript
// Optimize connection pool for Cloud Run
{
  connectionLimit: 5,  // Conservative for serverless
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
}
```

### Storage Optimization

- Use SSD storage for better performance
- Enable automatic storage increases
- Set appropriate backup retention (7-14 days)
- Use point-in-time recovery for critical data

## Backup and Recovery

### Automated Backups

```bash
# Configure automated backups
gcloud sql instances patch stock-trading-db \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --backup-location=us-central1
```

### Manual Backup

```bash
# Create manual backup
gcloud sql backups create --instance=stock-trading-db
```

### Point-in-Time Recovery

```bash
# Restore to specific time
gcloud sql instances clone stock-trading-db stock-trading-db-restore \
  --point-in-time=2025-06-27T10:30:00.000Z
```

This configuration provides a robust, scalable, and secure database setup for your Stock Trading App on Google Cloud Run.
