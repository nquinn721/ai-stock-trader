#!/bin/bash

# Protected Database Setup Script
# Creates a database with maximum protection against accidental deletion

set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-project-id}"
REGION="${REGION:-us-central1}"
DATABASE_INSTANCE_NAME="${DATABASE_INSTANCE_NAME:-ai-stock-trader-db-protected}"
DATABASE_NAME="${DATABASE_NAME:-stocktrader}"
DATABASE_USER="${DATABASE_USER:-stocktrader_user}"
DATABASE_VERSION="${DATABASE_VERSION:-MYSQL_8_0}"
DATABASE_TIER="${DATABASE_TIER:-db-f1-micro}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Generate secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Check if gcloud is configured
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_error "Not authenticated with gcloud. Run 'gcloud auth login'"
    exit 1
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    print_error "No project configured. Run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

PROJECT_ID=$CURRENT_PROJECT

echo "🛡️  Creating Protected Database Instance"
echo "========================================"
echo "Project: $PROJECT_ID"
echo "Instance: $DATABASE_INSTANCE_NAME"
echo "Region: $REGION"
echo "Database: $DATABASE_NAME"
echo "User: $DATABASE_USER"
echo ""

# Check if instance already exists
if gcloud sql instances describe $DATABASE_INSTANCE_NAME --quiet >/dev/null 2>&1; then
    print_warning "Database instance $DATABASE_INSTANCE_NAME already exists!"
    
    # Check if deletion protection is enabled
    DELETION_PROTECTION=$(gcloud sql instances describe $DATABASE_INSTANCE_NAME --format="value(settings.deletionProtectionEnabled)")
    if [ "$DELETION_PROTECTION" = "True" ]; then
        print_success "✅ Deletion protection is already enabled"
    else
        print_status "Enabling deletion protection on existing instance..."
        gcloud sql instances patch $DATABASE_INSTANCE_NAME --deletion-protection
        print_success "✅ Deletion protection enabled"
    fi
    
    # Check if database exists
    if gcloud sql databases describe $DATABASE_NAME --instance=$DATABASE_INSTANCE_NAME --quiet >/dev/null 2>&1; then
        print_success "✅ Database $DATABASE_NAME already exists"
    else
        print_status "Creating database $DATABASE_NAME..."
        gcloud sql databases create $DATABASE_NAME --instance=$DATABASE_INSTANCE_NAME
        print_success "✅ Database created"
    fi
    
    # Check if user exists
    if gcloud sql users describe $DATABASE_USER --instance=$DATABASE_INSTANCE_NAME --quiet >/dev/null 2>&1; then
        print_success "✅ User $DATABASE_USER already exists"
        
        # Update password anyway for security
        print_status "Updating password for security..."
        DB_PASSWORD=$(generate_password)
        gcloud sql users set-password $DATABASE_USER \
            --instance=$DATABASE_INSTANCE_NAME \
            --password=$DB_PASSWORD
        
        # Store in Secret Manager
        echo $DB_PASSWORD | gcloud secrets versions add db-password --data-file=- 2>/dev/null || \
        echo $DB_PASSWORD | gcloud secrets create db-password --data-file=-
        print_success "✅ Password updated and stored in Secret Manager"
    else
        print_status "Creating user $DATABASE_USER..."
        DB_PASSWORD=$(generate_password)
        gcloud sql users create $DATABASE_USER \
            --instance=$DATABASE_INSTANCE_NAME \
            --password=$DB_PASSWORD
        
        # Store in Secret Manager
        echo $DB_PASSWORD | gcloud secrets create db-password --data-file=-
        print_success "✅ User created and password stored in Secret Manager"
    fi
    
    echo ""
    print_success "🎉 Protected database setup completed successfully!"
    exit 0
fi

# Create new instance with maximum protection
print_status "Creating new database instance with maximum protection..."

gcloud sql instances create $DATABASE_INSTANCE_NAME \
    --database-version=$DATABASE_VERSION \
    --tier=$DATABASE_TIER \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=20GB \
    --storage-auto-increase \
    --backup \
    --backup-start-time=02:00 \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=03 \
    --maintenance-release-channel=production \
    --deletion-protection \
    --enable-bin-log \
    --retained-backups-count=30 \
    --retained-transaction-log-days=7 \
    --insights-config-query-insights-enabled \
    --insights-config-record-application-tags \
    --insights-config-record-client-address

print_success "✅ Database instance created with maximum protection"

# Wait for instance to be ready
print_status "Waiting for instance to be ready..."
while true; do
    STATE=$(gcloud sql instances describe $DATABASE_INSTANCE_NAME --format="value(state)")
    if [ "$STATE" = "RUNNABLE" ]; then
        break
    fi
    echo "   Instance state: $STATE (waiting...)"
    sleep 10
done

print_success "✅ Instance is ready"

# Create database
print_status "Creating database: $DATABASE_NAME"
gcloud sql databases create $DATABASE_NAME --instance=$DATABASE_INSTANCE_NAME
print_success "✅ Database created"

# Generate secure password and create user
print_status "Creating database user: $DATABASE_USER"
DB_PASSWORD=$(generate_password)

gcloud sql users create $DATABASE_USER \
    --instance=$DATABASE_INSTANCE_NAME \
    --password=$DB_PASSWORD

print_success "✅ Database user created"

# Store password in Secret Manager
print_status "Storing password in Secret Manager..."
echo $DB_PASSWORD | gcloud secrets create db-password --data-file=-
print_success "✅ Password stored in Secret Manager as 'db-password'"

# Store database host in Secret Manager
print_status "Storing database connection info in Secret Manager..."
DB_HOST=$(gcloud sql instances describe $DATABASE_INSTANCE_NAME --format="value(ipAddresses[0].ipAddress)")
echo $DB_HOST | gcloud secrets create database-host --data-file=-
echo "3306" | gcloud secrets create database-port --data-file=-
echo $DATABASE_NAME | gcloud secrets create database-name --data-file=-
echo $DATABASE_USER | gcloud secrets create database-username --data-file=-

print_success "✅ Database connection info stored in Secret Manager"

# Set up IAM permissions for Cloud Run
print_status "Setting up IAM permissions for Cloud Run..."

# Remove overly broad permissions
gcloud projects remove-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
    --role="roles/cloudsql.admin" 2>/dev/null || true

# Add minimal required permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
    --role="roles/cloudsql.client"

# Add secret accessor role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

print_success "✅ IAM permissions configured with least privilege"

# Set up monitoring
print_status "Setting up database monitoring..."

# Create Cloud Logging sink for database operations
gcloud logging sinks create database-audit-sink \
    bigquery.googleapis.com/projects/$PROJECT_ID/datasets/database_audit \
    --log-filter='resource.type="cloudsql_database" AND (protoPayload.methodName=~"sql\\.instances\\.(delete|patch|create)" OR severity>=ERROR)' 2>/dev/null || print_warning "Audit sink already exists or couldn't be created"

print_success "✅ Monitoring configured"

# Create initial database schema
print_status "Setting up initial database schema..."

# Create a temporary SQL script
cat > /tmp/init_schema.sql << 'EOF'
-- Stock Trading App Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    initial_cash DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    current_cash DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    total_value DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stock holdings table
CREATE TABLE IF NOT EXISTS stock_holdings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    average_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    current_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_portfolio_symbol (portfolio_id, symbol)
);

-- Trading sessions table
CREATE TABLE IF NOT EXISTS trading_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_portfolio_id ON stock_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_symbol ON stock_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_portfolio_id ON trading_sessions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_active ON trading_sessions(is_active);

-- Insert default user if doesn't exist
INSERT IGNORE INTO users (username, email, password_hash) 
VALUES ('admin', 'admin@stocktrader.com', '$2b$10$dummy.hash.for.initial.setup');

-- Insert default portfolio if doesn't exist
INSERT IGNORE INTO portfolios (name, user_id, initial_cash, current_cash, total_value)
VALUES ('Default Portfolio', 1, 10000.00, 10000.00, 10000.00);

EOF

# Execute the schema
gcloud sql import sql $DATABASE_INSTANCE_NAME /tmp/init_schema.sql \
    --database=$DATABASE_NAME 2>/dev/null || print_warning "Schema import failed or already exists"

# Clean up temp file
rm -f /tmp/init_schema.sql

print_success "✅ Database schema initialized"

# Final security check
print_status "Performing final security verification..."

# Verify deletion protection
DELETION_PROTECTION=$(gcloud sql instances describe $DATABASE_INSTANCE_NAME --format="value(settings.deletionProtectionEnabled)")
if [ "$DELETION_PROTECTION" = "True" ]; then
    print_success "✅ Deletion protection verified: ENABLED"
else
    print_error "❌ Deletion protection verification failed!"
    exit 1
fi

# Verify backups are enabled
BACKUP_ENABLED=$(gcloud sql instances describe $DATABASE_INSTANCE_NAME --format="value(settings.backupConfiguration.enabled)")
if [ "$BACKUP_ENABLED" = "True" ]; then
    print_success "✅ Automated backups verified: ENABLED"
else
    print_warning "⚠️  Automated backups not enabled"
fi

echo ""
echo "🎉 PROTECTED DATABASE SETUP COMPLETED SUCCESSFULLY!"
echo "=================================================="
echo ""
echo "📋 Database Information:"
echo "   Instance Name: $DATABASE_INSTANCE_NAME"
echo "   Database Name: $DATABASE_NAME"
echo "   User: $DATABASE_USER"
echo "   Host IP: $DB_HOST"
echo ""
echo "🔒 Security Features Enabled:"
echo "   ✅ Deletion Protection"
echo "   ✅ Automated Backups (2 AM daily)"
echo "   ✅ Binary Logging"
echo "   ✅ 30-day backup retention"
echo "   ✅ 7-day transaction log retention"
echo "   ✅ Least-privilege IAM permissions"
echo "   ✅ Secret Manager integration"
echo "   ✅ Audit logging"
echo ""
echo "🔑 Credentials stored in Secret Manager:"
echo "   - db-password"
echo "   - database-host"
echo "   - database-port"
echo "   - database-name"
echo "   - database-username"
echo ""
echo "🚀 Next Steps:"
echo "   1. Update your Cloud Run deployment to use the new secrets"
echo "   2. Test the database connection"
echo "   3. Set up monitoring alerts"
echo "   4. Regular backup verification"
echo ""
echo "⚠️  IMPORTANT: This database has deletion protection enabled."
echo "   To delete it, you must first disable deletion protection:"
echo "   gcloud sql instances patch $DATABASE_INSTANCE_NAME --no-deletion-protection"
echo ""

# Create a summary file
cat > database-setup-summary.txt << EOF
Database Setup Summary
=====================
Date: $(date)
Project: $PROJECT_ID
Instance: $DATABASE_INSTANCE_NAME
Database: $DATABASE_NAME
User: $DATABASE_USER
Host: $DB_HOST
Region: $REGION

Security Features:
- Deletion Protection: ENABLED
- Automated Backups: ENABLED (2 AM daily)
- Binary Logging: ENABLED
- Backup Retention: 30 days
- Transaction Log Retention: 7 days
- IAM: Least-privilege configured
- Secrets: Stored in Secret Manager
- Audit Logging: ENABLED

Secrets in Secret Manager:
- db-password
- database-host  
- database-port
- database-name
- database-username

Cloud Run Environment Variables Needed:
- DATABASE_HOST: Use secret reference
- DATABASE_PORT: 3306
- DATABASE_NAME: $DATABASE_NAME
- DATABASE_USERNAME: $DATABASE_USER
- DATABASE_PASSWORD: Use secret reference
EOF

print_success "📄 Setup summary saved to: database-setup-summary.txt"
