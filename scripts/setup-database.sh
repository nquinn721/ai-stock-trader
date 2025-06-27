#!/bin/bash

# AI Stock Trader - Database Setup Script
# This script creates and configures the Cloud SQL MySQL database

set -e

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-your-project-id}"
REGION="${REGION:-us-central1}"
DATABASE_INSTANCE_NAME="${DATABASE_INSTANCE_NAME:-ai-stock-trader-db}"
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

# Check if Cloud SQL instance exists
check_instance_exists() {
    gcloud sql instances describe ${DATABASE_INSTANCE_NAME} --quiet >/dev/null 2>&1
}

# Create Cloud SQL instance
create_database_instance() {
    print_status "Creating Cloud SQL instance: ${DATABASE_INSTANCE_NAME}..."
    
    if check_instance_exists; then
        print_warning "Database instance ${DATABASE_INSTANCE_NAME} already exists"
        return 0
    fi
    
    gcloud sql instances create ${DATABASE_INSTANCE_NAME} \
        --database-version=${DATABASE_VERSION} \
        --tier=${DATABASE_TIER} \
        --region=${REGION} \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup \
        --backup-start-time=02:00 \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=03 \
        --maintenance-release-channel=production \
        --deletion-protection
    
    print_success "Database instance created successfully"
}

# Create database
create_database() {
    print_status "Creating database: ${DATABASE_NAME}..."
    
    # Check if database already exists
    if gcloud sql databases describe ${DATABASE_NAME} --instance=${DATABASE_INSTANCE_NAME} --quiet >/dev/null 2>&1; then
        print_warning "Database ${DATABASE_NAME} already exists"
        return 0
    fi
    
    gcloud sql databases create ${DATABASE_NAME} \
        --instance=${DATABASE_INSTANCE_NAME}
    
    print_success "Database created successfully"
}

# Create database user
create_database_user() {
    print_status "Creating database user: ${DATABASE_USER}..."
    
    # Generate password
    DB_PASSWORD=$(generate_password)
    
    # Check if user already exists
    if gcloud sql users describe ${DATABASE_USER} --instance=${DATABASE_INSTANCE_NAME} --quiet >/dev/null 2>&1; then
        print_warning "User ${DATABASE_USER} already exists"
        print_status "Updating password for existing user..."
        gcloud sql users set-password ${DATABASE_USER} \
            --instance=${DATABASE_INSTANCE_NAME} \
            --password=${DB_PASSWORD}
    else
        # Create user
        gcloud sql users create ${DATABASE_USER} \
            --instance=${DATABASE_INSTANCE_NAME} \
            --password=${DB_PASSWORD}
    fi
    
    # Store password in Secret Manager
    store_database_password ${DB_PASSWORD}
    
    print_success "Database user created/updated successfully"
}

# Store database password in Secret Manager
store_database_password() {
    local password=$1
    print_status "Storing database password in Secret Manager..."
    
    # Create secret if it doesn't exist
    if ! gcloud secrets describe db-password --quiet >/dev/null 2>&1; then
        gcloud secrets create db-password --data-file=-<<< "${password}"
    else
        # Update existing secret
        gcloud secrets versions add db-password --data-file=-<<< "${password}"
    fi
    
    print_success "Database password stored in Secret Manager"
}

# Create database schema and initial data
setup_database_schema() {
    print_status "Setting up database schema..."
    
    # Create a temporary SQL file with schema
    cat > /tmp/schema.sql << 'EOF'
-- AI Stock Trader Database Schema

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
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    initial_balance DECIMAL(15,2) DEFAULT 10000.00,
    current_balance DECIMAL(15,2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stocks table
CREATE TABLE IF NOT EXISTS stocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    average_cost DECIMAL(10,4) NOT NULL,
    current_price DECIMAL(10,4),
    market_value DECIMAL(15,2),
    unrealized_pnl DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_portfolio_symbol (portfolio_id, symbol)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    side ENUM('BUY', 'SELL') NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    price DECIMAL(10,4) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    commission DECIMAL(10,2) DEFAULT 0.00,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    side ENUM('BUY', 'SELL') NOT NULL,
    order_type ENUM('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT') NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    price DECIMAL(10,4),
    stop_price DECIMAL(10,4),
    status ENUM('PENDING', 'FILLED', 'CANCELLED', 'REJECTED') DEFAULT 'PENDING',
    time_in_force ENUM('DAY', 'GTC', 'IOC', 'FOK') DEFAULT 'DAY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Trading signals table
CREATE TABLE IF NOT EXISTS trading_signals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(10) NOT NULL,
    signal_type ENUM('BUY', 'SELL', 'HOLD') NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    price DECIMAL(10,4) NOT NULL,
    reasoning TEXT,
    indicators JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News table
CREATE TABLE IF NOT EXISTS news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    url VARCHAR(500),
    source VARCHAR(100),
    sentiment_score DECIMAL(5,4),
    symbols JSON,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto trading rules table
CREATE TABLE IF NOT EXISTS auto_trading_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    conditions JSON NOT NULL,
    actions JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Trading sessions table
CREATE TABLE IF NOT EXISTS trading_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    status ENUM('ACTIVE', 'PAUSED', 'STOPPED') DEFAULT 'ACTIVE',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    total_trades INT DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0.00,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX idx_positions_symbol ON positions(symbol);
CREATE INDEX idx_trades_portfolio ON trades(portfolio_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_executed_at ON trades(executed_at);
CREATE INDEX idx_orders_portfolio ON orders(portfolio_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_signals_symbol ON trading_signals(symbol);
CREATE INDEX idx_signals_created_at ON trading_signals(created_at);
CREATE INDEX idx_news_symbols ON news(symbols(50));
CREATE INDEX idx_news_published_at ON news(published_at);

-- Insert some initial data
INSERT IGNORE INTO stocks (symbol, name, sector, industry) VALUES
('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics'),
('GOOGL', 'Alphabet Inc.', 'Technology', 'Internet Content & Information'),
('MSFT', 'Microsoft Corporation', 'Technology', 'Software'),
('AMZN', 'Amazon.com Inc.', 'Consumer Discretionary', 'Internet Retail'),
('TSLA', 'Tesla Inc.', 'Consumer Discretionary', 'Auto Manufacturers'),
('META', 'Meta Platforms Inc.', 'Technology', 'Social Media'),
('NVDA', 'NVIDIA Corporation', 'Technology', 'Semiconductors'),
('NFLX', 'Netflix Inc.', 'Consumer Discretionary', 'Entertainment'),
('DIS', 'The Walt Disney Company', 'Consumer Discretionary', 'Entertainment'),
('PYPL', 'PayPal Holdings Inc.', 'Technology', 'Financial Technology');

EOF

    # Execute schema setup
    gcloud sql import sql ${DATABASE_INSTANCE_NAME} /tmp/schema.sql --database=${DATABASE_NAME}
    
    # Clean up
    rm /tmp/schema.sql
    
    print_success "Database schema created successfully"
}

# Configure database for Cloud Run connection
configure_cloud_run_access() {
    print_status "Configuring Cloud Run access to database..."
    
    # Get the Cloud Run service account
    PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
    CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    
    # Grant Cloud SQL Client role to Cloud Run service account
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${CLOUD_RUN_SA}" \
        --role="roles/cloudsql.client"
    
    # Grant Secret Manager Secret Accessor role
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${CLOUD_RUN_SA}" \
        --role="roles/secretmanager.secretAccessor"
    
    print_success "Cloud Run access configured"
}

# Main function
main() {
    print_status "Starting database setup for AI Stock Trader..."
    
    # Validate project ID
    if [ "$PROJECT_ID" = "your-project-id" ]; then
        print_error "Please set your Google Cloud Project ID in the GOOGLE_CLOUD_PROJECT environment variable"
        exit 1
    fi
    
    # Enable required APIs
    print_status "Enabling required APIs..."
    gcloud services enable \
        sqladmin.googleapis.com \
        secretmanager.googleapis.com
    
    create_database_instance
    create_database
    create_database_user
    setup_database_schema
    configure_cloud_run_access
    
    print_success "✅ Database setup completed successfully!"
    print_status "Database instance: ${DATABASE_INSTANCE_NAME}"
    print_status "Database name: ${DATABASE_NAME}"
    print_status "Database user: ${DATABASE_USER}"
    print_status "Password stored in Secret Manager as: db-password"
    print_warning "Note: Database instance has deletion protection enabled"
}

# Run main function
main "$@"