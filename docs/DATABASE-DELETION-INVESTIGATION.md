# Database Deletion Investigation and Protection

## ⚠️ CRITICAL: Repeated Database Deletions

Your Google Cloud database keeps getting deleted. Here's how to investigate and prevent this.

## Immediate Investigation Steps

### 1. Check Who Deleted the Database

```bash
# Find deletion events in audit logs
gcloud logging read "protoPayload.methodName=sql.instances.delete" \
    --limit=10 \
    --format="table(timestamp,protoPayload.authenticationInfo.principalEmail,protoPayload.resourceName,protoPayload.request.body)"

# Check all recent database operations
gcloud logging read "resource.type=cloudsql_database AND severity>=WARNING" \
    --limit=50 \
    --since="24h" \
    --format="table(timestamp,severity,protoPayload.authenticationInfo.principalEmail,protoPayload.methodName)"
```

### 2. Check Cloud Build History

```bash
# Check recent builds that might have database operations
gcloud builds list --limit=20 --format="table(id,status,createTime,source.repoSource.branchName)"

# Check build logs for SQL operations
gcloud logging read "resource.type=build AND (textPayload:sql OR textPayload:database OR textPayload:delete)" \
    --limit=50 \
    --format="table(timestamp,resource.labels.build_id,textPayload)"
```

### 3. Audit IAM Permissions

```bash
# Check who has dangerous database permissions
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.role:(cloudsql.admin OR editor OR owner)" \
    --format="table(bindings.role,bindings.members)"
```

## Common Causes of Database Deletion

### 1. **Cloud Build Issues**

- Build steps that recreate infrastructure
- Test cleanup scripts running in production
- Database migration scripts that drop/recreate

### 2. **Automated Cleanup**

- Cost optimization scripts
- Resource lifecycle policies
- Testing environment cleanup affecting production

### 3. **Service Account Issues**

- Over-privileged service accounts
- Shared service accounts between environments
- Compromised service account keys

### 4. **Manual Errors**

- Accidental deletion via console
- Wrong environment selection
- Script errors

## Immediate Protection Measures

### 1. Emergency Database Protection

```bash
# Recreate database with maximum protection
INSTANCE_NAME="ai-stock-trader-db-protected"
PROJECT_ID="your-project-id"

# Create with deletion protection
gcloud sql instances create $INSTANCE_NAME \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=20GB \
    --storage-auto-increase \
    --backup \
    --backup-start-time=02:00 \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=03 \
    --deletion-protection \
    --enable-bin-log \
    --retained-backups-count=30 \
    --retained-transaction-log-days=7

# Create database
gcloud sql databases create stocktrader --instance=$INSTANCE_NAME

# Create user with strong password
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create stocktrader_user \
    --instance=$INSTANCE_NAME \
    --password=$DB_PASSWORD

# Store password in Secret Manager
echo $DB_PASSWORD | gcloud secrets create db-password-protected --data-file=-
```

### 2. Restrict Database Permissions

```bash
# Remove unnecessary admin permissions
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member='serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com' \
    --role='roles/cloudsql.admin'

# Add minimal required permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member='serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com' \
    --role='roles/cloudsql.client'
```

### 3. Set Up Monitoring and Alerts

```bash
# Create monitoring for database operations
gcloud logging sinks create database-audit-sink \
    bigquery.googleapis.com/projects/$PROJECT_ID/datasets/database_audit \
    --log-filter='resource.type="cloudsql_database" AND protoPayload.methodName=~"sql\\.instances\\.(delete|create|patch)"'

# Set up email notifications for database changes
gcloud alpha monitoring channels create \
    --display-name="Database Alert Email" \
    --type=email \
    --channel-labels=email_address=your-email@domain.com
```

## Updated Cloud Build Configuration

Create a safer Cloud Build configuration that doesn't affect the database:

```yaml
# cloudbuild-safe.yaml - Database-safe build configuration
steps:
  # Step 1: Build the application
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "build",
        "-t",
        "gcr.io/$PROJECT_ID/stock-trading-app:$BUILD_ID",
        "-f",
        "Dockerfile.cloudrun",
        ".",
      ]
    timeout: "1800s"

  # Step 2: Push the image
  - name: "gcr.io/cloud-builders/docker"
    args: ["push", "gcr.io/$PROJECT_ID/stock-trading-app:$BUILD_ID"]
    timeout: "600s"

  # Step 3: Deploy to Cloud Run (NO DATABASE OPERATIONS)
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: "gcloud"
    args:
      [
        "run",
        "deploy",
        "stock-trading-app",
        "--image",
        "gcr.io/$PROJECT_ID/stock-trading-app:$BUILD_ID",
        "--region",
        "us-central1",
        "--platform",
        "managed",
        "--allow-unauthenticated",
        "--port",
        "8080",
        "--memory",
        "4Gi",
        "--cpu",
        "2",
        "--set-secrets",
        "DATABASE_HOST=database-host-protected:latest,DATABASE_PASSWORD=db-password-protected:latest",
        "--set-env-vars",
        "NODE_ENV=production,DATABASE_PORT=3306,DATABASE_NAME=stocktrader,DATABASE_USERNAME=stocktrader_user",
      ]
    timeout: "600s"

# NO DATABASE MODIFICATION STEPS
substitutions:
  _REGION: "us-central1"

options:
  machineType: "E2_HIGHCPU_8"
  logging: "CLOUD_LOGGING_ONLY"

timeout: "2400s"
```

## Database Recovery Script

Create an automated recovery script:

```bash
#!/bin/bash
# database-recovery.sh - Automated database recovery

set -e

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-project-id}"
BACKUP_INSTANCE="ai-stock-trader-db-protected"
RECOVERY_INSTANCE="ai-stock-trader-db-recovery-$(date +%Y%m%d-%H%M%S)"

echo "🚨 Starting emergency database recovery..."

# Check if backup instance exists
if ! gcloud sql instances describe $BACKUP_INSTANCE --quiet >/dev/null 2>&1; then
    echo "❌ Backup instance not found! Creating new database..."
    bash scripts/setup-database.sh
    exit 1
fi

# Get latest backup
LATEST_BACKUP=$(gcloud sql backups list --instance=$BACKUP_INSTANCE --limit=1 --format="value(id)")

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backups found!"
    exit 1
fi

# Restore from backup
echo "📦 Restoring from backup: $LATEST_BACKUP"
gcloud sql backups restore $LATEST_BACKUP \
    --restore-instance=$RECOVERY_INSTANCE \
    --backup-instance=$BACKUP_INSTANCE

# Update Cloud Run to use recovered database
echo "🔄 Updating Cloud Run service..."
gcloud run services update stock-trading-app \
    --region=us-central1 \
    --set-env-vars="DATABASE_HOST=$(gcloud sql instances describe $RECOVERY_INSTANCE --format='value(ipAddresses[0].ipAddress)')"

echo "✅ Database recovery completed!"
echo "New instance: $RECOVERY_INSTANCE"
```

## Prevention Checklist

### ✅ Immediate Actions:

- [ ] Run investigation scripts to find deletion source
- [ ] Create protected database instance with deletion protection
- [ ] Restrict IAM permissions to minimum required
- [ ] Set up monitoring and alerts
- [ ] Review Cloud Build configuration
- [ ] Create database recovery script

### ✅ Code Review Actions:

- [ ] Search codebase for database drop/delete operations
- [ ] Review migration scripts
- [ ] Check test cleanup procedures
- [ ] Audit all database-related scripts

### ✅ Ongoing Monitoring:

- [ ] Daily backup verification
- [ ] Weekly access audit
- [ ] Monthly permission review
- [ ] Quarterly disaster recovery testing

## Emergency Response Plan

### If Database Gets Deleted Again:

1. **Immediate Response (0-5 minutes)**:

   ```bash
   # Run investigation
   bash scripts/investigate-deletion.sh

   # Start recovery
   bash scripts/database-recovery.sh
   ```

2. **Short-term Response (5-30 minutes)**:
   - Notify stakeholders
   - Document incident timeline
   - Implement additional protections

3. **Long-term Response (1-24 hours)**:
   - Root cause analysis
   - Process improvements
   - Update monitoring and alerts

---

**🔍 Next Steps**: Run the investigation scripts immediately to identify the root cause of the deletions.
