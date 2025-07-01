# Database Connection Policy

⚠️ **CRITICAL: NEVER TOUCH DATABASE CONNECTION SETTINGS** ⚠️

This document establishes strict policies for database connection configuration to prevent accidental data loss, connection failures, and environment mixing.

## 🔒 ABSOLUTE RULES

### **Rule #1: Never Modify DB Connection Settings**

**NEVER** change database connection settings unless explicitly authorized by the project lead.

```typescript
// ❌ FORBIDDEN: Never modify these values
DATABASE_HOST = localhost;
DATABASE_USERNAME = admin;
DATABASE_PASSWORD = password;
DATABASE_NAME = stocktrading_dev;
```

### **Rule #2: Environment Separation**

**NEVER** mix local and production database credentials.

```bash
# ✅ LOCAL (backend/.env)
DATABASE_HOST=localhost
DATABASE_USERNAME=admin
DATABASE_PASSWORD=password
DATABASE_NAME=stocktrading_dev

# ✅ PRODUCTION (Cloud Run Environment Variables)
DATABASE_HOST=35.238.63.253
DATABASE_USERNAME=stocktrader
DATABASE_PASSWORD=[SECRET_MANAGER]
DATABASE_NAME=stocktrading_prod
```

### **Rule #3: No Hardcoded Credentials**

**NEVER** hardcode database credentials in source code.

```typescript
// ❌ FORBIDDEN
const connection = createConnection({
  host: "localhost",
  username: "admin",
  password: "password",
});

// ✅ REQUIRED
const connection = createConnection({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});
```

## 📋 Current Configuration Status

### **Local Development Environment**

```bash
# File: backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=admin
DATABASE_PASSWORD=password
DATABASE_NAME=stocktrading_dev
```

**Status**: ✅ **WORKING** - Successfully connects to local MySQL instance
**Last Verified**: July 1, 2025
**Test Command**: `npm run seed` (produces 98 stocks)

### **Production Environment**

```bash
# Cloud Run Environment Variables (via Google Secret Manager)
DATABASE_HOST=35.238.63.253
DATABASE_PORT=3306
DATABASE_USERNAME=stocktrader
DATABASE_PASSWORD=[MANAGED_BY_SECRET_MANAGER]
DATABASE_NAME=stocktrading_prod
CLOUD_SQL_CONNECTION_NAME=heroic-footing-460117-k8:us-central1:stocktrading-mysql
```

**Status**: ✅ **WORKING** - Cloud SQL connection via Unix sockets
**Last Verified**: June 29, 2025 (deployment successful)
**Connection Method**: Cloud SQL Unix Socket (`/cloudsql/[CONNECTION_NAME]`)

## 🛡️ Protection Mechanisms

### **1. Code-Level Protection**

The database configuration includes automatic validation:

```typescript
// app.module.ts - Built-in validation
if (!dbHost || !dbUsername || !dbPassword || !dbName) {
  console.error("❌ Missing required database configuration");
  throw new Error("Missing required database configuration");
}
```

### **2. Environment Detection**

Automatic environment detection prevents credential mixing:

```typescript
const isCloudRun = process.env.K_SERVICE && process.env.K_REVISION;
const isProduction = nodeEnv === "production";

if (isCloudRun || (isProduction && cloudSqlConnection)) {
  // Use Cloud SQL Unix Socket
} else {
  // Use standard TCP connection
}
```

### **3. Connection Testing**

Test database connections before making changes:

```bash
# Test local connection
cd backend && node test-db-connection.js

# Test production connection
cd backend && node test-prod-db-connection.js
```

## 📁 Configuration Files Overview

### **Do NOT Modify These Files**

| File                        | Purpose                  | Status           |
| --------------------------- | ------------------------ | ---------------- |
| `backend/.env`              | Local development config | ✅ Working       |
| `database-config.env`       | Template for production  | ✅ Template only |
| `.env.test`                 | Test environment config  | ✅ Working       |
| `backend/src/app.module.ts` | TypeORM connection logic | ✅ Working       |

### **Environment Variables Hierarchy**

1. **Local Development**: `backend/.env`
2. **Testing**: `.env.test`
3. **Production**: Cloud Run environment variables (Secret Manager)
4. **Template**: `database-config.env` (for reference only)

## 🚨 Emergency Procedures

### **If Database Connection Fails**

1. **DO NOT** change connection settings immediately
2. **First**: Test current configuration
   ```bash
   cd backend && node test-db-connection.js
   ```
3. **Check**: MySQL service status
   ```bash
   netstat -an | findstr :3306
   ```
4. **Verify**: Environment variables are loaded
   ```bash
   # In backend directory
   node -e "console.log(process.env.DATABASE_HOST)"
   ```

### **If You Must Change Credentials**

1. **Create backup** of current working configuration
2. **Test new credentials** with test script first
3. **Update documentation** to reflect changes
4. **Verify both local and production** environments still work
5. **Update this policy document** with new status

## 📊 Connection Status Dashboard

### **Last Successful Connections**

- **Local MySQL**: ✅ July 1, 2025 at 14:30 UTC
- **Production Cloud SQL**: ✅ June 29, 2025 at 18:45 UTC
- **Test Environment**: ✅ June 29, 2025 at 16:22 UTC

### **Current Database Stats**

```bash
# Local Development Database
Database: stocktrading_dev
Tables: 46
Stocks: 98 (seeded successfully)
Host: localhost:3306
Username: admin
```

### **Health Check Commands**

```bash
# Quick connection test
cd backend && node test-db-connection.js

# Check stock data
curl http://localhost:8000/api/stocks

# Test seeding (only if empty)
curl -X POST http://localhost:8000/api/stocks/seed
```

## 🔄 Standard Operating Procedures

### **When Onboarding New Developers**

1. **Provide this document** first
2. **Verify local MySQL** is installed and running
3. **Copy backend/.env.example** to backend/.env (if exists)
4. **Test connection** before any development
5. **Never share production credentials**

### **When Deploying to Production**

1. **Never change** local development credentials
2. **Use Secret Manager** for production credentials only
3. **Test deployment** in staging environment first
4. **Monitor logs** for connection success
5. **Rollback plan** ready if connections fail

### **When Troubleshooting**

1. **Check service status** (MySQL, Cloud SQL)
2. **Verify environment variables** are loaded correctly
3. **Test with provided scripts** before making changes
4. **Consult this document** for known working configurations
5. **Document any changes** made during resolution

---

## 🎯 Summary

- ✅ **Local**: MySQL on localhost:3306 with admin/password
- ✅ **Production**: Cloud SQL via Unix socket with managed credentials
- ✅ **Testing**: Isolated test database configuration
- ⚠️ **POLICY**: Never modify without authorization
- 📋 **STATUS**: All environments working as of July 1, 2025

**If you need to change database settings, contact the project lead first.**
