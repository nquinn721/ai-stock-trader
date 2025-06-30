# Database Protection & Backup Guide

⚠️ **CRITICAL: NEVER DELETE THE PRODUCTION DATABASE** ⚠️

This document provides comprehensive guidelines to protect the production cloud database from accidental deletion and ensure proper backup procedures.

## 🔒 Database Protection Overview

### **Production Database Information**

- **Type**: PostgreSQL Cloud Database
- **Environment**: Google Cloud SQL / Production
- **Critical Data**: Stock prices, portfolios, trades, user data, ML models
- **Business Impact**: Complete data loss would destroy all trading history and portfolios

## 🚨 CRITICAL SAFETY MEASURES

### **1. Database Deletion Prevention**

#### **A. Cloud Console Protection**

```bash
# NEVER run these commands in production:
❌ gcloud sql instances delete [INSTANCE_NAME]
❌ DELETE FROM portfolios;
❌ DROP DATABASE trading_app;
❌ DROP TABLE portfolios;
❌ TRUNCATE TABLE trades;
```

#### **B. Access Control**

- **Principle of Least Privilege**: Only authorized personnel have delete permissions
- **Multi-person approval** required for any destructive operations
- **Separate staging/production credentials**

#### **C. Database Connection Safety**

```typescript
// ✅ GOOD: Always verify environment
if (process.env.NODE_ENV === "production") {
  console.log("🔴 PRODUCTION DATABASE - EXTRA CAUTION REQUIRED");
  // Add additional safety checks
}

// ❌ BAD: Direct deletion commands without verification
// await this.portfolioRepository.clear(); // NEVER DO THIS
```

### **2. Backup Strategy**

#### **A. Automated Backups**

- **Daily automated backups** via Google Cloud SQL
- **Point-in-time recovery** enabled (7-day retention minimum)
- **Cross-region backup replication**
- **Backup verification** automated testing

#### **B. Manual Backup Procedures**

```bash
# Weekly manual backup command
gcloud sql export sql [INSTANCE_NAME] gs://[BACKUP_BUCKET]/manual-backup-$(date +%Y%m%d).sql \
  --database=trading_app

# Verify backup integrity
gcloud sql import sql [TEST_INSTANCE] gs://[BACKUP_BUCKET]/backup-file.sql \
  --database=trading_app_test
```

#### **C. Backup Schedule**

- **Automated**: Daily at 2:00 AM UTC
- **Manual**: Weekly on Sundays
- **Pre-deployment**: Before any major releases
- **Pre-migration**: Before schema changes

### **3. Environment Isolation**

#### **A. Database Environment Separation**

```env
# Development
DATABASE_URL=postgresql://dev-user:dev-pass@localhost:5432/trading_app_dev

# Staging
DATABASE_URL=postgresql://staging-user:staging-pass@staging-db:5432/trading_app_staging

# Production (PROTECTED)
DATABASE_URL=postgresql://prod-user:prod-pass@prod-db:5432/trading_app_prod
```

#### **B. Connection Validation**

```typescript
// Add to database connection service
export class DatabaseService {
  private validateEnvironment() {
    const dbUrl = process.env.DATABASE_URL;

    if (process.env.NODE_ENV === "production") {
      if (!dbUrl.includes("prod-db")) {
        throw new Error("❌ PRODUCTION ENV BUT NOT PRODUCTION DB");
      }

      console.log("🔴 CONNECTED TO PRODUCTION DATABASE");
      console.log("🔴 ALL OPERATIONS WILL AFFECT LIVE DATA");
    }
  }
}
```

## 📋 Operational Procedures

### **4. Deployment Safety**

#### **A. Pre-Deployment Checklist**

- [ ] Verify target environment (staging vs production)
- [ ] Confirm database migration scripts are tested
- [ ] Create manual backup before deployment
- [ ] Verify rollback procedures are ready
- [ ] Check environment variables are correct

#### **B. Database Migration Safety**

```typescript
// ✅ GOOD: Safe migration example
export class SafeMigration implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Always backup data before schema changes
    if (process.env.NODE_ENV === "production") {
      console.log("🔴 PRODUCTION MIGRATION - BACKUP REQUIRED");
      // Automated backup trigger here
    }

    // Add column with default value (safe)
    await queryRunner.query(`
      ALTER TABLE portfolios 
      ADD COLUMN new_field VARCHAR(255) DEFAULT 'default_value'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Always provide rollback
    await queryRunner.query(`ALTER TABLE portfolios DROP COLUMN new_field`);
  }
}
```

### **5. Monitoring & Alerts**

#### **A. Database Health Monitoring**

- **Connection pool monitoring**
- **Query performance tracking**
- **Storage usage alerts**
- **Backup success/failure notifications**

#### **B. Critical Alerts**

```typescript
// Database monitoring service
export class DatabaseMonitoringService {
  async checkDatabaseHealth() {
    try {
      // Check connection
      await this.connection.query("SELECT 1");

      // Check critical tables
      const portfolioCount = await this.portfolioRepository.count();
      const tradeCount = await this.tradeRepository.count();

      if (portfolioCount === 0 || tradeCount === 0) {
        await this.sendCriticalAlert("DATABASE_DATA_MISSING");
      }
    } catch (error) {
      await this.sendCriticalAlert("DATABASE_CONNECTION_FAILED", error);
    }
  }
}
```

## 🔧 Database Access Guidelines

### **6. Safe Database Operations**

#### **A. Read Operations (Safe)**

```sql
-- ✅ SAFE: Read operations
SELECT * FROM portfolios WHERE user_id = 'specific_user';
SELECT COUNT(*) FROM trades;
SELECT * FROM stocks WHERE symbol = 'AAPL';
```

#### **B. Write Operations (Caution Required)**

```sql
-- ✅ SAFE: Specific updates with WHERE clause
UPDATE portfolios SET total_value = 10000 WHERE id = 'specific_id';
INSERT INTO trades (portfolio_id, symbol, quantity) VALUES (1, 'AAPL', 10);

-- ⚠️ CAUTION: Updates without WHERE (affects all records)
UPDATE portfolios SET status = 'active'; -- BE VERY CAREFUL

-- ❌ DANGEROUS: Never run these in production
DELETE FROM portfolios; -- NEVER
DROP TABLE trades; -- NEVER
TRUNCATE TABLE stocks; -- NEVER
```

#### **C. Database Admin Commands**

```sql
-- Only for emergencies with proper authorization
-- VACUUM ANALYZE; -- OK for maintenance
-- REINDEX TABLE portfolios; -- OK for performance
-- DROP DATABASE trading_app; -- ❌ NEVER EVER
```

### **7. Recovery Procedures**

#### **A. Point-in-Time Recovery**

```bash
# In case of data corruption (EMERGENCY ONLY)
gcloud sql backups restore [BACKUP_ID] \
  --restore-instance=[INSTANCE_NAME] \
  --backup-instance=[BACKUP_INSTANCE]
```

#### **B. Partial Data Recovery**

```sql
-- Recover specific table from backup
-- 1. Create backup table
CREATE TABLE portfolios_backup AS SELECT * FROM portfolios;

-- 2. Restore from backup (if needed)
-- INSERT INTO portfolios SELECT * FROM portfolios_backup WHERE condition;
```

## 📞 Emergency Contacts & Procedures

### **8. Incident Response**

#### **A. Database Emergency Team**

- **Primary DBA**: [Name, Phone, Email, Slack/Teams handle]
- **DevOps Lead**: [Name, Phone, Email, Slack/Teams handle]
- **System Administrator**: [Name, Phone, Email, Slack/Teams handle]
- **Project Lead**: [Name, Phone, Email, Slack/Teams handle]
- **Cloud Provider Support**: [Support ticket system, phone number]

#### **B. Emergency Response Steps**

1. **STOP ALL DEPLOYMENTS** immediately
2. **Assess the scope** of the issue
3. **Contact emergency team**
4. **Document the incident**
5. **Execute recovery plan**
6. **Conduct post-incident review**

### **9. Regular Maintenance**

#### **A. Weekly Tasks**

- [ ] Verify automated backups completed successfully
- [ ] Check database performance metrics
- [ ] Review connection pool usage
- [ ] Validate backup restoration process

#### **B. Monthly Tasks**

- [ ] Test disaster recovery procedures
- [ ] Review access permissions
- [ ] Update backup retention policies
- [ ] Performance optimization review

## 🔐 Security Measures

### **10. Access Control**

#### **A. Database User Permissions**

```sql
-- Application user (limited permissions)
GRANT SELECT, INSERT, UPDATE ON portfolios TO app_user;
GRANT SELECT, INSERT, UPDATE ON trades TO app_user;
-- NO DELETE or DROP permissions for app user

-- Admin user (full permissions, emergency only)
GRANT ALL PRIVILEGES ON ALL TABLES TO admin_user;
-- Require MFA and audit logging for admin access
```

#### **B. Connection Security**

- **SSL/TLS encryption** for all connections
- **IP whitelisting** for database access
- **VPC private networking**
- **Regular password rotation**

### **11. Compliance & Auditing**

#### **A. Audit Logging**

```typescript
// Database audit service
export class DatabaseAuditService {
  async logDatabaseOperation(operation: string, table: string, user: string) {
    if (operation.includes("DELETE") || operation.includes("DROP")) {
      await this.sendSecurityAlert({
        level: "CRITICAL",
        operation,
        table,
        user,
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
      });
    }
  }
}
```

#### **B. Regular Security Reviews**

- **Monthly access reviews**
- **Quarterly security assessments**
- **Annual disaster recovery testing**
- **Compliance audits**

### **12. Additional Protection Measures**

#### **A. Database-Level Safeguards**

```sql
-- Create a protection trigger to prevent mass deletions
CREATE OR REPLACE FUNCTION prevent_mass_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion of more than 10% of records at once
  IF TG_OP = 'DELETE' THEN
    DECLARE
      total_count INTEGER;
      affected_count INTEGER;
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM %I', TG_TABLE_NAME) INTO total_count;

      -- If trying to delete more than 10% of records, block it
      IF total_count > 100 AND OLD.id IS NULL THEN -- Mass delete detected
        RAISE EXCEPTION 'MASS DELETION BLOCKED: Cannot delete more than 10%% of records at once. Contact DBA for approval.';
      END IF;
    END;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER portfolios_deletion_protection
  BEFORE DELETE ON portfolios
  FOR EACH STATEMENT
  EXECUTE FUNCTION prevent_mass_deletion();

CREATE TRIGGER trades_deletion_protection
  BEFORE DELETE ON trades
  FOR EACH STATEMENT
  EXECUTE FUNCTION prevent_mass_deletion();
```

#### **B. Application-Level Circuit Breakers**

```typescript
// Database operation circuit breaker
export class DatabaseProtectionService {
  private static readonly MAX_BULK_OPERATIONS = 100;

  async validateBulkOperation(operation: string, count: number) {
    if (process.env.NODE_ENV === "production") {
      if (
        operation.toLowerCase().includes("delete") &&
        count > this.MAX_BULK_OPERATIONS
      ) {
        throw new Error(
          `🛑 BULK DELETION BLOCKED: Attempting to delete ${count} records. Maximum allowed: ${this.MAX_BULK_OPERATIONS}. Contact admin for approval.`
        );
      }

      if (operation.toLowerCase().includes("update") && count > 1000) {
        console.warn(
          `⚠️ LARGE BULK UPDATE: Updating ${count} records. Consider breaking into smaller batches.`
        );
      }
    }
  }

  async safeDelete(repository: Repository<any>, criteria: any) {
    const count = await repository.count(criteria);
    await this.validateBulkOperation("DELETE", count);

    // Log the operation
    console.log(`🔍 PRODUCTION DELETE: ${count} records affected`, criteria);

    return await repository.delete(criteria);
  }
}
```

#### **C. Real-time Backup Verification**

```bash
#!/bin/bash
# Backup verification script (run daily)

# Check if backup completed successfully
BACKUP_STATUS=$(gcloud sql operations list --instance=production-db --limit=1 --format="value(operationType,status)")

if [[ $BACKUP_STATUS == *"BACKUP"* && $BACKUP_STATUS == *"DONE"* ]]; then
  echo "✅ Daily backup completed successfully"

  # Test backup integrity
  BACKUP_FILE=$(gcloud sql backups list --instance=production-db --limit=1 --format="value(id)")

  # Create test instance and restore backup (automated test)
  gcloud sql instances create test-restore-$(date +%Y%m%d) \
    --backup=$BACKUP_FILE \
    --tier=db-f1-micro \
    --region=us-central1 \
    --quiet

  # Verify data integrity
  PORTFOLIO_COUNT=$(gcloud sql databases execute-sql test-restore-$(date +%Y%m%d) \
    --sql="SELECT COUNT(*) FROM portfolios;" \
    --format="value(result[0])")

  if [[ $PORTFOLIO_COUNT -gt 0 ]]; then
    echo "✅ Backup integrity verified - $PORTFOLIO_COUNT portfolios found"
  else
    echo "❌ BACKUP INTEGRITY FAILED - Alerting team"
    # Send alert to team
  fi

  # Clean up test instance
  gcloud sql instances delete test-restore-$(date +%Y%m%d) --quiet

else
  echo "❌ BACKUP FAILED - Immediate attention required"
  # Send critical alert
fi
```

---

## ⚠️ FINAL REMINDERS

### **NEVER DO THESE THINGS:**

1. ❌ Delete the production database instance
2. ❌ Run `DELETE` or `TRUNCATE` without WHERE clauses
3. ❌ Drop tables in production
4. ❌ Disable automated backups
5. ❌ Share production database credentials
6. ❌ Run untested migrations in production
7. ❌ Access production DB from development tools

### **ALWAYS DO THESE THINGS:**

1. ✅ Verify environment before any database operation
2. ✅ Create backups before major changes
3. ✅ Test all operations in staging first
4. ✅ Use transactions for multi-step operations
5. ✅ Monitor database health continuously
6. ✅ Document all database changes
7. ✅ Follow the principle of least privilege

---

**This database contains critical trading data that cannot be recreated. When in doubt, ASK FOR HELP before proceeding with any database operations.**

**Emergency Contact**: [Add 24/7 emergency phone number, email, and incident response system]
**Last Updated**: June 29, 2025
**Next Review**: Monthly
